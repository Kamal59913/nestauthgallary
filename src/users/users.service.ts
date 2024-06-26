import { Model } from 'mongoose';
import { BadRequestException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from 'src/schemas/users.schema';
import { Image, ImageDocument } from 'src/schemas/postImages.schema';
import { CreateUserDTO } from 'src/dto/createUser.dto';
import { SignInUserDTO } from 'src/dto/signInUser.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { AuthService } from 'src/auth/auth.service';

import { CACHE_MANAGER } from '@nestjs/cache-manager'; /* cache manager */
import { Cache } from 'cache-manager';



@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel('Image') private imageModel: Model<Image>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache, 
    private jwtService: JwtService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly authService: AuthService
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

async signIn(signInUserDTO: SignInUserDTO): Promise<{ retrivedUser: UserDocument, accessToken: string, refreshToken : string}> {
  const { username, password } = signInUserDTO;
  const user = await this.userModel.findOne({ username }).exec();
  const isPasswordCorrect = await bcrypt.compare(password, user.password);

  if(!isPasswordCorrect) {
    throw new BadRequestException('Wrong Password Entered')
  }

  const retrivedUser = await this.userModel.findOne({ username }).select("-password").exec();

  const {accessToken, refreshToken} = await this.authService.generateTokens(user._id);

  console.log(refreshToken)

  user.refreshtoken = refreshToken;
  await user.save();

  return {retrivedUser, accessToken, refreshToken};
}

async upload(files: Express.Multer.File[], currentUser: UserDocument): Promise<any[]> {
  console.log(typeof files, files);
  const uploadResults = [];

  for (const file of files) {
    const uploadedImage = await this.cloudinaryService.uploadImage(file.path);
    console.log(uploadedImage.url);

    const imageResult = {
      width: uploadedImage.width.toString(),
      height: uploadedImage.height.toString(),
      format: uploadedImage.format.toString(),
      resource_type: uploadedImage.resource_type.toString(),
      created_at: uploadedImage.created_at.toString(),
      type: uploadedImage.type.toString(),
      original_filename: uploadedImage.original_filename.toString(),
      url: uploadedImage.url.toString(),
      bytes: uploadedImage.bytes.toString(),
    };

    uploadResults.push(imageResult);
  }

  console.log("here ir is",uploadResults)

  const newImages = new this.imageModel({
    images: uploadResults,
    uploaderId: currentUser._id,
  });

  await newImages.save();
  return uploadResults;
}

async getImagesAll(): Promise<Image[]> {

  const images = await this.imageModel.find().populate({
    path: 'uploaderId',
    select: '-password',
    model: this.userModel
  }).select("-password").exec();

  const cachedImages = await this.cacheManager.set('nestjsimageauth',images, 20)
    // Manually set TTL using Redis specific parameters
  console.log(cachedImages)

  const cachedData = await this.cacheManager.get('nestjsimageauth')

  return images;
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
  


async refreshTheToken(refresh_token: string) : Promise<{accessToken: string, refreshToken: string}> {
  /* Checking is any user with the current refresh-token exists*/
  const user = await this.userModel.findOne({refreshtoken: refresh_token});

  if(!user) {
    throw new Error("No User with this refresh token exists")
  }

  /*checking if the refresh-token is valid*/
  const decoded = await this.authService.validateRefreshToken(refresh_token)
  if (!decoded || decoded.id !== user._id.toString()) {
    throw new UnauthorizedException('Invalid refresh token');
  }
  const { accessToken, refreshToken } = await this.authService.generateTokens(user._id);

  /*saving new refresh-token*/
  user.refreshtoken = refreshToken;
  await user.save();
  return { accessToken, refreshToken}
  }
}   