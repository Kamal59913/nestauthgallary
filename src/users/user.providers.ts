import { Connection } from 'mongoose';
import { usersSchema } from 'src/schemas/users.schema';

export const usersProviders = [
  {
    provide: 'User_MODEL',
    useFactory: (connection: Connection) => connection.model('Cat', usersSchema),
    inject: ['DATABASE_CONNECTION'],
  },
];