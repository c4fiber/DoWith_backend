import { Injectable, Logger } from "@nestjs/common";
import { MulterOptionsFactory } from "@nestjs/platform-express";
import * as multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class MulterConfigService implements MulterOptionsFactory{
  dir_path: string;

  constructor() {
    this.dir_path = process.env.IMAGE_PATH;
    this.mkdir();
  }

  mkdir(){
    try{
      fs.readdirSync(this.dir_path);
    } catch(err){
      fs.mkdirSync(this.dir_path);
    }
  }

  changePath(dir_path: string){
    this.dir_path = dir_path;
  }

  createMulterOptions(){
    const dir_path = this.dir_path;
    const option = {
      storage: multer.diskStorage({
        destination(req, file, done){

          done(null, dir_path);
        },
        filename(req, file, done){
          const ext = path.extname(file.originalname);
          const name = path.basename(file.originalname, ext);

          done(null, `${name}_${Date.now()}${ext}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
    };

    return option;
  }
}