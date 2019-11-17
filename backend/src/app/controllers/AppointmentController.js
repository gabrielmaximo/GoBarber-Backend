import * as Yup from 'yup';
import { startOfHour, parseISO, isBefore, format, subHours } from 'date-fns';
import pt from 'date-fns/locale/pt-BR';
import Appointment from '../models/Appointment';
import File from '../models/File';
import User from '../models/User';
import Notification from '../schemas/Notification';
import CancellationMail from '../jobs/CancellationMail';
import Queue from '../../lib/Queue';
import Cache from '../../lib/Cache';

class AppointmentController {
  async index(req, res) {
    const { page = 1 } = req.query;

    const cacheKey = `user:${req.userId}:appointments:${page}`;

    const cached = await Cache.get(cacheKey);

    if (cached) {
      return res.json(cached);
    }

    const appointmets = await Appointment.findAll({
      where: { user_id: req.userId, canceled_at: null },
      order: ['date'],
      attributes: ['id', 'date', 'past', 'cancelable'],
      limit: 20,
      offset: (page - 1) * 20,
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['id', 'name'],
          include: [
            {
              model: File,
              as: 'avatar',
              attributes: ['id', 'path', 'url'],
            },
          ],
        },
      ],
    });

    await Cache.set(cacheKey, appointmets);

    return res.json(appointmets);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      provider_id: Yup.number().required(),
      date: Yup.date().required(),
    });

    /**
     * Check if request body is valid
     */
    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validations fails!' });
    }

    const { provider_id, date } = req.body;

    /**
     * Check if a user is making an appointment for himself
     */
    if (req.userId === provider_id) {
      return res
        .status(400)
        .json({ error: 'You cannot request appointments for yourself' });
    }

    /**
     * Check if provider_id is a provider
     */
    const isProvider = await User.findOne({
      where: { id: provider_id, provider: true },
    });

    if (!isProvider) {
      return res.status(401).json({ error: 'Provider id invalid' });
    }

    /**
     * Check for past dates
     */

    const hourStart = await startOfHour(parseISO(date));

    if (isBefore(hourStart, new Date())) {
      return res.status(400).json({ error: 'Past dates are not permited' });
    }

    /**
     * Check date availability
     */
    const isNotAvailability = await Appointment.findOne({
      where: {
        provider_id,
        canceled_at: null,
        date: hourStart,
      },
    });

    if (isNotAvailability) {
      return res.status(400).json({ error: 'This date is not available' });
    }

    const appointment = await Appointment.create({
      user_id: req.userId,
      provider_id,
      date: hourStart,
    });

    /**
     * Notify appointment provider
     */
    const user = await User.findByPk(req.userId);
    const formattedDate = format(
      hourStart,
      "'dia' dd 'de' MMMM', às' H:mm'h'",
      { locale: pt }
    );

    const notification = await Notification.create({
      content: `Novo agendamento! cliente: ${user.name}, para ${formattedDate}`,
      user: provider_id,
    });

    await Cache.invalidatePrefix(`user:${req.userId}`);

    const ownerSocket = req.connectedUsers[provider_id];

    if (ownerSocket) {
      req.io.to(ownerSocket).emit('notification', notification);
    }

    return res.json({ appointment });
  }

  async delete(req, res) {
    const appointment = await Appointment.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['name', 'email'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['name'],
        },
      ],
    });

    /**
     * Check if appointment exists
     */
    if (!appointment) {
      return res.status(400).json({ error: 'Appointment does not exists!' });
    }

    /**
     * Checks if logged user is owner that appointment
     */
    if (appointment.user_id !== req.userId) {
      return res.status(401).json({ error: 'Permission denied!' });
    }

    /**
     * Check if the appointment already canceled
     */
    if (appointment.canceled_at) {
      return res
        .status(400)
        .json({ error: 'this appointment  already been canceled' });
    }

    const dateSub = subHours(appointment.date, 2);

    if (isBefore(dateSub, new Date())) {
      return res
        .status(401)
        .json({ error: 'You can only cancel 2 hours in advance' });
    }

    appointment.canceled_at = new Date();
    await appointment.save();

    /**
     * Notify appointment cancellation
     */
    const formattedDate = format(
      appointment.date,
      "dd 'de' MMMM', às' H:mm'h'",
      { locale: pt }
    );
    await Notification.create({
      content: `${appointment.user.name}, cancelou o agendamento marcado para ${formattedDate}`,
      user: appointment.provider_id,
    });

    /**
     * Send email to notify appointment cancellation to provider
     */
    await Queue.add(CancellationMail.key, {
      appointment,
    });

    await Cache.invalidatePrefix(`user:${req.userId}`);

    return res.json(appointment);
  }
}

export default new AppointmentController();
