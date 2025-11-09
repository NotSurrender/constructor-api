import { Injectable } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Advert } from './advert.schema';
import { AdvertResponseDocument } from './advert.interface';

const projection: Partial<Record<keyof Advert, 0 | 1>> = {
  userId: 0,
};

@Injectable()
export class AdvertService {
  constructor(
    @InjectModel(Advert.name)
    private advertModel: Model<Advert>,
  ) {}

  async find(userId: string): Promise<AdvertResponseDocument[]> {
    return this.advertModel
      .find(
        {
          userId: new Types.ObjectId(userId),
        },
        projection,
      )
      .exec();
  }

  async create(advert: Advert) {
    const newAdvert = new this.advertModel(advert);
    return newAdvert.save();
  }

  async patch(
    userId: string,
    id: string,
    advert: Partial<Advert>,
  ): Promise<AdvertResponseDocument> {
    return this.advertModel
      .findByIdAndUpdate(
        { _id: id, userId: new Types.ObjectId(userId) },
        advert,
        { new: true, projection },
      )
      .exec();
  }

  async delete(userId: string, id: string): Promise<AdvertResponseDocument> {
    return this.advertModel
      .findByIdAndDelete(
        { _id: id, userId: new Types.ObjectId(userId) },
        { projection },
      )
      .exec();
  }
}
