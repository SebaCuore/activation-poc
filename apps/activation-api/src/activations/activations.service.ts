import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomUUID } from 'node:crypto';
import type { CreateActivationDto } from './activation';
import { Activation } from './activation.schema';

@Injectable()
export class ActivationsService {
  constructor(
    @InjectModel(Activation.name) private readonly activationModel: Model<Activation>,
  ) {}

  async create(dto: CreateActivationDto) {
    if (!dto.customerId || !dto.planId) {
      throw new BadRequestException('customerId y planId son obligatorios');
    }

    const activation = await this.activationModel.create({
      _id: `act-${randomUUID().slice(0, 8)}`,
      customerId: dto.customerId,
      planId: dto.planId,
      simulateFailure: dto.simulateFailure ?? 'none',
      status: 'PENDING',
    });

    return { activationId: activation._id, status: activation.status };
  }

  async findOne(id: string) {
    const activation = await this.activationModel.findById(id).lean();
    if (!activation) {
      throw new NotFoundException(`No existe la activación ${id}`);
    }
    return activation;
  }
}