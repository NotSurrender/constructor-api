import { Module } from '@nestjs/common';
import { AdvertController } from './advert.controller';
import { WbModule } from 'src/wb/wb.module';
import { AuthModule } from 'src/auth/auth.module';
import { ProjectModule } from 'src/project/project.module';
import { AdvertService } from './advert.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Advert, AdvertSchema } from './advert.schema';

@Module({
  controllers: [AdvertController],
  providers: [AdvertService],
  imports: [
    MongooseModule.forFeature([
      {
        name: Advert.name,
        schema: AdvertSchema,
      },
    ]),
    WbModule,
    AuthModule,
    ProjectModule,
  ],
})
export class AdvertModule {}
