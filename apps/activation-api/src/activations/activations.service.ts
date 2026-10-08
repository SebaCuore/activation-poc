import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Activation, CreateActivationDto } from './activation';

@Injectable()
export class ActivationsService {
  // "Base de datos" temporal en memoria. En el paso 3c la cambiamos por Mongo.
  private readonly activations = new Map<string, Activation>();

  create(dto: CreateActivationDto) {
    if (!dto.customerId || !dto.planId) {
      throw new BadRequestException('customerId y planId son obligatorios');
    }

    const activation: Activation = {
      activationId: `act-${randomUUID().slice(0, 8)}`,
      customerId: dto.customerId,
      planId: dto.planId,
      simulateFailure: dto.simulateFailure ?? 'none',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    this.activations.set(activation.activationId, activation);
    return { activationId: activation.activationId, status: activation.status };
  }

  findOne(id: string) {
    const activation = this.activations.get(id);
    if (!activation) {
      throw new NotFoundException(`No existe la activación ${id}`);
    }
    return activation;
  }
}