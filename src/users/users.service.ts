import { Model } from 'mongoose';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from 'src/schemas/users.schema';
import { Image, ImageDocument } from 'src/schemas/postImages.schema';
import { CreateUserDTO } from 'src/dto/createUser.dto';
import { SignInUserDTO } from 'src/dto/signInUser.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel('Image') private imageModel: Model<Image>,
    private jwtService: JwtService,
    private readonly cloudinaryService: CloudinaryService
  ) {}

  async createUser(createUserDTO: CreateUserDTO): Promise<User> {
    const findUser = await this.userModel.findOne({username: createUserDTO.username})
    if(findUser) {
      throw new Error("User already exists")
    }
    const createdUser = new this.userModel(createUserDTO);
    return createdUser.save();
  }

  async getAllUsers(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  returnUser() : string {
    return 'here is the return'
}

async signIn(signInUserDTO: SignInUserDTO): Promise<{ retrivedUser: UserDocument; token: string }> {
  const { username, password } = signInUserDTO;
  const user = await this.userModel.findOne({ username }).exec();
  const isPasswordCorrect = await bcrypt.compare(password, user.password);

  if(!isPasswordCorrect) {
    throw new BadRequestException('Wrong Password Entered')
  }

  const retrivedUser = await this.userModel.findOne({ username }).select("-password").exec();

  const token = await this.jwtService.signAsync({id: user._id});
  return {retrivedUser, token};
}

async upload(files: Express.Multer.File[], currentUser: UserDocument): Promise<any[]> {
  const uploadResults = [];
  if (files.length == 1) {
    const uploadedImage = await this.cloudinaryService.uploadImage(files[0].path);
    console.log(uploadedImage.url);
  }
  
  if(files.length>1) {
  for (const file of files) {
    const uploadedImage = await this.cloudinaryService.uploadImage(file.path);
    console.log(uploadedImage.url);
    uploadResults.push(uploadedImage.url);
  }
}

  const newImages = new this.imageModel({
    images: uploadResults,
    uploaderId: currentUser._id
  })

  await newImages.save();
  return uploadResults; // Retu
}

async getImagesAll(): Promise<Image[]> {
    return this.imageModel.find().populate({
      path: 'uploaderId',
      select: '-password',
      model: this.userModel
    }).select("-password").exec();
  }

  async uploadedHourAgo(): Promise<any> {
      const lasthour = new Date(Date.now() - 1000 * 60 * 60);
      const recentImage = await this.imageModel.find({uploadDate: {$gte: lasthour}})
      return recentImage
  }

  async getImageByUploaderId(id: string): Promise<any> {
      const images = await this.imageModel.find({uploaderId: id})
      return images
  }

  async getUserById(username: string): Promise<UserDocument[]> {
    try {
      const users = await this.userModel.find({ $text: { $search: username } });
      return users;
    } catch (error) {
      console.error("Error searching users:", error);
      throw new Error("An error occurred while searching users");
    }
  }

  async deleteImageById(id: string): Promise<any> {
    const images = await this.imageModel.findByIdAndDelete(id)
    return images
}
async replaceEmailById(id: string, newEmail: string): Promise<any> {
  const images = await this.userModel.findByIdAndUpdate(
    id, {email: newEmail} , { new: true }
  )
  return images
}
  
}   