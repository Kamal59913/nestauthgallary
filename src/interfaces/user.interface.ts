import { Document } from "mongoose";

export interface User extends Document{
    username: string;
    fullname: string;   
    email: string;
    password: string;
    refreshtoken: string;
}