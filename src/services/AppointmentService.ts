import { getCustomRepository } from 'typeorm'
import { startOfHour } from 'date-fns'
import AppointmentRepository from '../repositories/AppointmentsRepository'
import Appointment from '../models/Appointment'
import AppError from '../errors/AppError'

interface CreateRequest {
  date: Date
  provider_id: string
}

class AppointmentService {
  async store({ date, provider_id }: CreateRequest): Promise<Appointment> {
    const appointmentRepository = getCustomRepository(AppointmentRepository)

    const appointmentDate = startOfHour(date)

    const appointmentBooked = await appointmentRepository.findByDate(
      appointmentDate,
    )

    if (appointmentBooked)
      throw new AppError('This appointments already booked', 400)

    const newAppointment = appointmentRepository.create({
      provider_id,
      date: appointmentDate,
    })

    await appointmentRepository.save(newAppointment)

    return newAppointment
  }
}

export default new AppointmentService()
