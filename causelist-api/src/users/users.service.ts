import crypto from 'crypto';
import parsePhoneNumber from 'libphonenumber-js';
import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { User } from '../schemas/user.schema.js';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Otp } from '../schemas/otp.schema.js';
import { ICreateUserDataParams, UserRole } from '../interfaces/users.js';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsPhoneNumber,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateUserDataParams implements ICreateUserDataParams {
  @IsPhoneNumber('KE', {
    message: 'Must be valid Kenya phone number',
  })
  phone: string;

  @IsNotEmpty({
    message: 'First Name is required',
  })
  firstName: string;

  @IsNotEmpty({
    message: 'Last Name is required',
  })
  lastName: string;

  @IsEmail(
    {},
    {
      message: 'Must be valid email',
    },
  )
  email: string;
}

@Injectable()
export class UsersService {
  private readonly log = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Otp.name) private otpModel: Model<Otp>,
  ) {}

  normalizePhone(userPhone: string) {
    const parsedPhone = parsePhoneNumber(userPhone, 'KE');
    return parsedPhone?.number;
  }

  randomCode(length: number): string {
    const bytes = crypto.randomBytes(length);
    let result = '';
    for (let i = 0; i < length; ++i) {
      result += String.fromCharCode((bytes.at(i) % 10) + '0'.charCodeAt(0));
    }
    return result;
  }

  async findById(id: string): Promise<User | undefined> {
    return this.userModel.findById(id);
  }

  async findOneByPhone(userPhone: string): Promise<User | undefined> {
    return this.userModel.findOne({
      phone: this.normalizePhone(userPhone),
    });
  }
  async isExistingUser(
    userPhone: string,
    userEmail: string,
  ): Promise<User | undefined> {
    return this.userModel.findOne({
      $or: [{ phone: this.normalizePhone(userPhone) }, { email: userEmail }],
    });
  }
  async createUser(userData: CreateUserDataParams): Promise<User> {
    let { email, phone, ...createData } = userData;
    email = email.toLowerCase();
    phone = this.normalizePhone(phone);
    const existing = await this.isExistingUser(phone, email);
    if (existing) {
      throw new ConflictException(
        'Phone or Email is already used by another user',
      );
    }
    const newUser = new this.userModel({
      ...createData,
      email,
      phone,
      role: UserRole.Lawyer,
    });
    await newUser.save();
    return newUser;
  }

  async makeOtp(
    userPhone: string,
    expiresInSeconds = 600,
  ): Promise<Otp | null> {
    const phone = this.normalizePhone(userPhone);
    const user = await this.findOneByPhone(userPhone);
    if (!user) {
      return null;
    }
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
    const otp = await this.otpModel.findOneAndUpdate(
      { phone },
      { code: this.randomCode(6), used: false, expiresAt, user },
      { upsert: true, new: true },
    );
    return otp;
  }

  async checkOtp(userPhone: string, code: string): Promise<User | null> {
    const user = await this.findOneByPhone(userPhone);
    if (!user) {
      return null;
    }
    // Handle special dev/staging login
    if (
      process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging' ||
      process.env.NEXT_PUBLIC_ENVIRONMENT === 'development'
    ) {
      if (user.role === UserRole.Admin && code === '369369') {
        return user;
      }
    }

    const found = await this.otpModel.findOne(
      {
        phone: user.phone,
        code,
        used: false,
        expiresAt: { $gte: new Date() },
      },
      undefined,
      {
        populate: 'user',
      },
    );
    let result = null;
    if (found) {
      found.used = true;
      await found.save();
      result = found.user;
    }
    this.log.debug(`checkOtp(${user.phone}, ${code}) => ${!!result}`);
    return result;
  }
}
