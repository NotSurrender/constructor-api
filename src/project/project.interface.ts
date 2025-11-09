import { ProjectDocument } from './project.schema';

export type ProjectResponseDocument = Omit<ProjectDocument, 'userId'>;
