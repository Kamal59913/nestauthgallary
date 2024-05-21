import { Body, Controller, Delete, Get, HttpStatus, Inject, Param, Patch, Post, Req, Res, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { CreateUserDTO } from 'src/dto/createUser.dto';
import { SignInUserDTO } from 'src/dto/signInUser.dto';
import { UsersService } from './users.service';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { AuthGuard } from 'src/auth/auth.guard';
import { CACHE_MANAGER, CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager'
import { SkipThrottle, Throttle } from '@nestjs/throttler';

@Controller('users')
export class UsersController {
   constructor(private readonly userService: UsersService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache /* for automatically caching it*/
   ) { }
   
   @Post('signup')
   async createUser(@Res() response: any, @Body() creatUserDto: CreateUserDTO) {
   try {
    const newUser = await this.userService.createUser(creatUserDto);
    return response.status(HttpStatus.CREATED).json({
    message: 'User has been created successfully',
    newUser });
  } catch (err) {
    return response.status(HttpStatus.BAD_REQUEST).json({
    statusCode: 400,
    message: 'Error: User not created!',
    error: 'Bad Request'
 });
}
}

@Post('login')
async signIn(@Res() response: any, @Body() signInUserDTO: SignInUserDTO) {
try {
 const {retrivedUser, accessToken, refreshToken} = await this.userService.signIn(signInUserDTO);
 response.cookie('accessToken', accessToken, { httpOnly: true });
 response.cookie('refreshToken', refreshToken, { httpOnly: true });

 return response.status(HttpStatus.CREATED).json({
 message: 'User has logged in successfully',
 retrivedUser,});
} catch (err) {
 return response.status(HttpStatus.BAD_REQUEST).json({
  
 statusCode: 400,
 message: 'Error: Unable to login user',
 error: 'Bad Request'
});
}
}

@Post('logout')
async signOut(@Res() response: any) {
  response.clearCookie('accessToken');
  response.clearCookie('refreshToken');
  return response.json({
    message: 'successfully logged out the user'
  })
}

@UseGuards(AuthGuard)
@Get('getallusers')
async getAllUsers(@Res() response: any, @Req() request: any) {
try {
  const currentUser = request.user;
  const usersData = await this.userService.getAllUsers();
  return response.status(HttpStatus.OK).json({
  message: 'All students data found successfully',usersData,
  currentUser: currentUser
});
 } catch (err) {
  return response.status(err.status).json(err.response);
 }
}

@UseGuards(AuthGuard)
@Post('images')
@UseInterceptors(FileFieldsInterceptor([
  {name: 'files', maxCount: 4}
], {
   storage: diskStorage({
     destination: (req, file, cb) => {
      cb(null, "./public/temp")
     }
     , filename: (req, file, cb) => {
       cb(null, file.originalname)
     }
   })
 }))
 async upload(@UploadedFiles() files: { files: Express.Multer.File[] }, @Req() request: any) {
  const currentUser = request.user;
  const fileArray = files.files;
  return this.userService.upload(fileArray, currentUser);
}

// @Throttle()
@Get('getimages')
async getAllImages(@Res() response: any) {
  try {
    const cachedData = await this.cacheManager.get('nestjsimageauth');
    if (cachedData) {
      console.log('Data retrieved from cache');
      return response.status(HttpStatus.OK).json({
        images: cachedData
      });
    } else {
      console.log('Data retrieved from database and now cached');
      const images = await this.userService.getImagesAll();
      await this.cacheManager.set('nestjsimageauth', images);
      return response.status(HttpStatus.OK).json({
        images
      });
  }

  } catch (error) {
   return response.json({
    message: "an error occured while retreiving images"
   }) 
  }
}

@Get('uploadedAnHourAgo') 
async uploadedHourAgo(@Res() response: any) {
  try {
    const recentImage = await this.userService.uploadedHourAgo();
    return response.status(HttpStatus.OK).json({
      recentImage
    })
  } catch (error) {
   return response.json({
    message: "an error occured while retreiving images"
   }) 
  }
  }

@Get('getImage/:id') 
async getImageByUploaderId(@Res() response: any, @Param('id') id: string ) {
  try {
    const images = await this.userService.getImageByUploaderId(id);
    return response.status(HttpStatus.OK).json({
      images
    })
  } catch (error) {
   return response.json({
    message: "an error occured while retreiving images"
   }) 
  }
  }

  @Get('getUser/:username') 
  async getUserById(@Res() response: any, @Param('username') username: string ) {
    try {
      const users = await this.userService.getUserById(username);
      return response.status(HttpStatus.OK).json({
        users
      })
    } catch (error) {
     return response.json({
      message: "an error occured while retreiving users"
     }) 
    }
    }

@Delete('deleteImage/:id') 
async deleteImageById(@Res() response: any, @Param('id') id: string ) {
  try {
    const deletedImage = await this.userService.deleteImageById(id);
    return response.status(HttpStatus.OK).json({
      deletedImage,
      "success" : "deleted successfully"
    })
  } catch (error) {
   return response.json({
    message: "an error occured while retreiving images"
   }) 
  }
  }

@Patch('replaceemail/:id') 
async replaceEmailById(@Res() response: any, @Param('id') id: string, @Body('email') newEmail: string) {
  try {
    const user = await this.userService.replaceEmailById(id, newEmail);
    return response.status(HttpStatus.OK).json({
      user,
      "success" : "email changed successfully"
    })
  } catch (error) {
   return response.json({
    message: "Error occured changing the email"
   }) 
  }
  }

@Post('refresh-token') 
async refreshTheToken(@Req() request: any, @Res() response: any){
  try {
    const cookies = request.cookies;
    const refresh_token = cookies.refreshToken;
 
    const { accessToken, refreshToken} = await this.userService.refreshTheToken(refresh_token);
    response.cookie('accessToken', accessToken, { httpOnly: true });
    response.cookie('refreshToken', refreshToken, { httpOnly: true });

    return response.status(HttpStatus.CREATED).json({
      message: 'Tokens are successfully refreshed',
      'accessToken': accessToken,
      'refreshToken': refreshToken
    });
  } catch (error) {
    return response.status(HttpStatus.BAD_REQUEST).json({
      statusCode: 400,
      message: 'Unable to refresh the token',
      error: 'Bad Request'
     });
  }

  }
}

