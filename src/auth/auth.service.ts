import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Types } from 'mongoose'

@Injectable()
export class AuthService {
    constructor(private readonly jwtService: JwtService) {}
    
    validateToken(accessToken: string) {
        return this.jwtService.verify(accessToken, {
            secret : process.env.JWT_SECRET
        });
    }   

    async generateTokens(userId: Types.ObjectId) {
        const payload = {id: userId}
        const accessToken = this.jwtService.sign(payload, {
            expiresIn: '1h'
        })

        const refreshToken = this.jwtService.sign(payload, {
            expiresIn: '1d'
        })
        return {
            accessToken,
            refreshToken
        };
    }

        validateRefreshToken(refreshToken: string) {
            return this.jwtService.verify(refreshToken, {
                secret : process.env.JWT_SECRET
            });
        }   


}