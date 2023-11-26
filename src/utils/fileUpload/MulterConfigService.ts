import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { MulterOptionsFactory } from '@nestjs/platform-express';
import * as multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { DoWithException } from 'src/do-with-exception/do-with-exception';

@Injectable()
export class MulterConfig implements MulterOptionsFactory {
  dir_path: string;

  constructor() {
    this.dir_path = process.env.IMAGE_PATH;
    this.mkdir();
  }

  mkdir() {
    try {
      fs.readdirSync(this.dir_path);
    } catch (err) {
      fs.mkdirSync(this.dir_path);
    }
  }

  changePath(dir_path: string) {
    this.dir_path = dir_path;
  }

  createMulterOptions() {
    const dir_path = this.dir_path;
    const option = {
      storage: multer.diskStorage({
        destination(req, file, done) {
          Logger.debug(`File Path = ${dir_path}`);
          done(null, dir_path);
        },
        filename(req, file, done) {
          const allowed_exts = ['.jpg', '.jpeg', '.png', '.gif'];
          const ext = path.extname(file.originalname);
          const name = path.basename(file.originalname, ext);

          if (!allowed_exts.includes(ext.toLowerCase())) {
            done(
              new DoWithException(
                '지원하지 않는 파일 확장자입니다.',
                '1000',
                HttpStatus.BAD_REQUEST,
              ),
              file.originalname,
            );
          }

          Logger.debug(`Saved File name = ${name}_${Date.now()}${ext}`);
          done(null, `${name}_${Date.now()}${ext}`);
        },
      }),
      //limits: { fileSize: 5 * 1024 * 1024 }
    };

    return option;
  }
}
