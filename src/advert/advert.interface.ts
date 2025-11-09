import { AdvertDocument } from './advert.schema';

export type AdvertResponseDocument = Omit<AdvertDocument, 'userId'>;
