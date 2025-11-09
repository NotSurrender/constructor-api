import { HttpStatus, Injectable, HttpException } from "@nestjs/common";
import {
  ClientSession,
  Connection,
  Model,
  ProjectionType,
  SaveOptions,
  Types,
  UpdateQuery,
} from "mongoose";
import { InjectModel, InjectConnection } from "@nestjs/mongoose";
import { Project } from "./project.schema";
import { UpdateProjectDto } from "./dto/update-project.dto";
import { CreateProjectDto } from "./dto/create-project.dto";
import { ProjectResponseDocument } from "./project.interface";
import { PROJECT_ALREADY_EXIST_ERROR } from "./project.constants";
import { InvestInProjectDto } from "./dto/invest-in-project.dto";
import { BalanceOperationService } from "src/balance-operation/balance-operation.service";
import { WithdrawFromProjectDto } from "./dto/withdraw-from-project.dto";
import { TransferToProjectDto } from "./dto/transfer-to-project.dto";

const projection: ProjectionType<Project> = {
  userId: 0,
  createdAt: 0,
  updatedAt: 0,
};

@Injectable()
export class ProjectService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<Project>,
    @InjectConnection() private readonly connection: Connection,
    private readonly balanceOperationService: BalanceOperationService
  ) {}

  async find(userId: string): Promise<ProjectResponseDocument[]> {
    return this.projectModel
      .find({ userId: new Types.ObjectId(userId) }, projection)
      .sort({ createdAt: -1 })
      .exec();
  }

  async findById(userId: string, id: string): Promise<ProjectResponseDocument> {
    return this.projectModel
      .findById(
        { _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) },
        projection
      )
      .exec();
  }

  async findByName(
    userId: string,
    name: string
  ): Promise<ProjectResponseDocument> {
    return this.projectModel
      .findOne({ userId: new Types.ObjectId(userId), name }, projection)
      .exec();
  }

  async findByGoodIds(
    userId: string,
    goodIds: number[]
  ): Promise<ProjectResponseDocument> {
    return this.projectModel
      .findOne(
        {
          userId: new Types.ObjectId(userId),
          goodIds,
        },
        projection
      )
      .exec();
  }

  async create(
    userId: string,
    dto: CreateProjectDto
  ): Promise<ProjectResponseDocument> {
    const newProject = new this.projectModel({
      name: dto.name,
      goodIds: [],
      color: dto.color,
      balance: 0,
      numberGoodsOnTheWay: 0,
      userId: new Types.ObjectId(userId),
    });

    return newProject.save();
  }

  async patch(
    userId: string,
    projectId: string,
    data: UpdateProjectDto & { balance?: number }
  ): Promise<ProjectResponseDocument | null> {
    return this.projectModel
      .findByIdAndUpdate(
        { _id: projectId, userId: new Types.ObjectId(userId) },
        data,
        {
          new: true,
          projection,
        }
      )
      .exec();
  }

  async delete(
    userId: string,
    id: string
  ): Promise<ProjectResponseDocument | null> {
    return this.projectModel
      .findByIdAndDelete(
        { _id: id, userId: new Types.ObjectId(userId) },
        { projection }
      )
      .exec();
  }

  async investInProject(
    userId: string,
    projectId: string,
    { amount }: InvestInProjectDto
  ): Promise<Project> {
    const investSession = await this.connection.startSession();

    try {
      investSession.startTransaction();

      const investedProject = await this.projectModel
        .findOneAndUpdate(
          {
            _id: new Types.ObjectId(projectId),
            userId: new Types.ObjectId(userId),
          },
          { $inc: { balance: amount } },
          { session: investSession }
        )
        .exec();

      await this.balanceOperationService.create(userId, "investition", {
        amount,
        toProjectId: investedProject.id,
        toProjectName: investedProject.name,
      });

      await investSession.commitTransaction();
      return investedProject;
    } catch (error) {
      await investSession.abortTransaction();
      throw error;
    } finally {
      await investSession.endSession();
    }
  }

  async withdrawFromProject(
    userId: string,
    projectId: string,
    { amount }: WithdrawFromProjectDto
  ): Promise<Project> {
    const withdrawSession = await this.connection.startSession();

    try {
      withdrawSession.startTransaction();

      const targetProject = await this.projectModel.findOneAndUpdate(
        {
          _id: new Types.ObjectId(projectId),
          userId: new Types.ObjectId(userId),
        },
        { $inc: { balance: -amount } },
        { session: withdrawSession }
      );

      await this.balanceOperationService.create(userId, "withdrawal", {
        amount,
        toProjectId: targetProject.id,
        toProjectName: targetProject.name,
      });

      await withdrawSession.commitTransaction();
      return targetProject;
    } catch (error) {
      await withdrawSession.abortTransaction();
      throw error;
    } finally {
      await withdrawSession.endSession();
    }
  }

  async transferToProject(
    userId: string,
    projectIdFrom: string,
    dto: TransferToProjectDto
  ): Promise<Project> {
    const transferSession = await this.connection.startSession();

    try {
      transferSession.startTransaction();

      const projectFrom = await this.projectModel.findOneAndUpdate(
        {
          _id: new Types.ObjectId(projectIdFrom),
          userId: new Types.ObjectId(userId),
        },
        { $inc: { balance: -dto.amount } },
        { session: transferSession }
      );

      const projectTo = await this.projectModel.findOneAndUpdate(
        {
          _id: new Types.ObjectId(dto.projectId),
          userId: new Types.ObjectId(userId),
        },
        { $inc: { balance: dto.amount } },
        { session: transferSession }
      );

      await this.balanceOperationService.create(userId, "transfer", {
        amount: dto.amount,
        toProjectId: projectTo._id.toString(),
        toProjectName: projectTo.name,
        fromProjectId: projectFrom._id.toString(),
        fromProjectName: projectFrom.name,
      });

      await transferSession.commitTransaction();
      return projectTo;
    } catch (error) {
      await transferSession.abortTransaction();
      throw error;
    } finally {
      await transferSession.endSession();
    }
  }

  async decreaseBalance(
    userId: string,
    data: {
      projectId: string;
      amount: number;
      goodId?: string;
    },
    session?: ClientSession
  ) {
    const filterUpdate: UpdateQuery<Project> = {
      $inc: { balance: -data.amount },
    };

    if (data.goodId) {
      filterUpdate.$push = { goodIds: new Types.ObjectId(data.goodId) };
    }

    return this.projectModel
      .findByIdAndUpdate(
        {
          _id: new Types.ObjectId(data.projectId),
          userId: new Types.ObjectId(userId),
        },
        filterUpdate,
        {
          new: true,
          projection,
          session,
        }
      )
      .exec();
  }

  async validateProjectDto(
    userId: string,
    dto: UpdateProjectDto,
    projectId?: string
  ): Promise<void | never> {
    const project = await this.projectModel.findOne({
      userId: new Types.ObjectId(userId),
      $or: [{ name: dto.name }, { goodIds: { $in: dto.goodIds } }],
    });

    if (project && project._id.toString() !== projectId) {
      throw new HttpException(PROJECT_ALREADY_EXIST_ERROR, HttpStatus.CONFLICT);
    }
  }

  async attachGood(
    userId: string,
    projectId: string,
    goodId: string,
    saveOptions?: SaveOptions
  ) {
    return await this.projectModel
      .findByIdAndUpdate(
        { _id: projectId, userId: new Types.ObjectId(userId) },
        {
          goodIds: { $push: [new Types.ObjectId(goodId)] },
        },
        saveOptions
      )
      .exec();
  }
}
