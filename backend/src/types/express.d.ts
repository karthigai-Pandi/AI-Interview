import { IUser } from '../models/User';

declare global {
  namespace Express {
    // Passport types default User to {}; extend with our Mongoose user document.
    interface User extends IUser {}
  }
}

export {};
