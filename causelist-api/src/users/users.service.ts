import crypto from 'crypto';
import parsePhoneNumber from 'libphonenumber-js';
import { Injectable, Logger } from '@nestjs/common';
import { User } from '../schemas/user.schema.js';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Otp } from '../schemas/otp.schema.js';

const SPECIAL_LOGIN = ['+254768628673', '+254799880299'];

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
    const phone = this.normalizePhone(userPhone);
    // Handle special dev login
    if (SPECIAL_LOGIN.includes(phone) && code === '369369') {
      return this.userModel.findOne({ phone });
    }

    const found = await this.otpModel.findOne(
      {
        phone,
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
    this.log.debug(`checkOtp(${phone}, ${code}) => ${!!result}`);
    return result;
  }
}
