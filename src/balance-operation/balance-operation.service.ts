import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import {
  BalanceOperation,
  BalanceOperationDocument,
} from "./balance-operation.schema";
import { FilterQuery, Model, SaveOptions, Types } from "mongoose";
import {
  BalanceOperationResponseDocument,
  BalanceOperationType,
} from "./balance-operation.interface";

@Injectable()
export class BalanceOperationService {
  constructor(
    @InjectModel(BalanceOperation.name)
    private balanceOperationModel: Model<BalanceOperation>
  ) {}

  async find(
    userId: string,
    projectId: string,
    filters?: {
      operationType?: BalanceOperationType;
      dateFrom?: string;
      dateUntil?: string;
      size?: number;
    }
  ): Promise<BalanceOperationResponseDocument[]> {
    const filterQuery: FilterQuery<BalanceOperation> = {
      userId: new Types.ObjectId(userId),
      $or: [
        { toProjectId: new Types.ObjectId(projectId) },
        { fromProjectId: new Types.ObjectId(projectId) },
      ],
    };

    if (filters?.operationType) {
      filterQuery.type = filters.operationType;
    }

    if (filters?.dateFrom || filters?.dateUntil) {
      const createdAtFilter = {};

      if (filters.dateFrom) {
        const dateFrom = new Date(filters.dateFrom);
        createdAtFilter["$gte"] = new Date(
          dateFrom.getFullYear(),
          dateFrom.getMonth(),
          dateFrom.getDate()
        );
      }

      if (filters?.dateUntil) {
        const dateUntil = new Date(filters.dateUntil);
        dateUntil.setDate(dateUntil.getDate() + 1);
        createdAtFilter["$lte"] = new Date(
          dateUntil.getFullYear(),
          dateUntil.getMonth(),
          dateUntil.getDate()
        );
      }

      filterQuery.createdAt = createdAtFilter;
    }

    return this.balanceOperationModel
      .find(filterQuery, { userId: 0 })
      .sort({ createdAt: -1 })
      .limit(filters?.size ? filters.size * 10 : 10)
      .exec();
  }

  async findById(
    userId: string,
    id: string
  ): Promise<BalanceOperationResponseDocument> {
    return this.balanceOperationModel
      .findById(
        { _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) },
        { fromProjectName: 1, toProjectName: 1 }
      )
      .exec();
  }

  async create<T extends BalanceOperationType>(
    userId: string,
    procurementType: T,
    data: T extends "transfer"
      ? {
          amount: number;
          toProjectId: string;
          toProjectName: string;
          fromProjectId: string;
          fromProjectName: string;
        }
      : { amount: number; toProjectId: string; toProjectName: string },
    saveOptions?: SaveOptions
  ): Promise<BalanceOperationDocument> {
    if ("fromProjectId" in data) {
      return new this.balanceOperationModel({
        type: procurementType,
        amount: data.amount,
        toProjectId: new Types.ObjectId(data.toProjectId),
        toProjectName: data.toProjectName,
        fromProjectId: new Types.ObjectId(data.fromProjectId),
        fromProjectName: data.fromProjectName,
        userId: new Types.ObjectId(userId),
      }).save(saveOptions);
    }

    return new this.balanceOperationModel({
      type: procurementType,
      amount: data.amount,
      toProjectId: new Types.ObjectId(data.toProjectId),
      toProjectName: data.toProjectName,
      userId: new Types.ObjectId(userId),
    }).save(saveOptions);
  }

  async count(
    userId: string,
    projectId: string,
    filters?: {
      operationType?: BalanceOperationType;
      dateFrom?: string;
      dateUntil?: string;
    }
  ): Promise<number> {
    const filterQuery: FilterQuery<BalanceOperation> = {
      userId: new Types.ObjectId(userId),
      $or: [
        { toProjectId: new Types.ObjectId(projectId) },
        { fromProjectId: new Types.ObjectId(projectId) },
      ],
    };

    if (filters?.operationType) {
      filterQuery.type = filters.operationType;
    }

    if (filters?.dateFrom || filters?.dateUntil) {
      const createdAtFilter = {};

      if (filters.dateFrom) {
        const dateFrom = new Date(filters.dateFrom);
        createdAtFilter["$gte"] = new Date(
          dateFrom.getFullYear(),
          dateFrom.getMonth(),
          dateFrom.getDate()
        );
      }

      if (filters?.dateUntil) {
        const dateUntil = new Date(filters.dateUntil);
        dateUntil.setDate(dateUntil.getDate() + 1);
        createdAtFilter["$lte"] = new Date(
          dateUntil.getFullYear(),
          dateUntil.getMonth(),
          dateUntil.getDate()
        );
      }

      filterQuery.createdAt = createdAtFilter;
    }

    return this.balanceOperationModel.countDocuments(filterQuery).exec();
  }
}
