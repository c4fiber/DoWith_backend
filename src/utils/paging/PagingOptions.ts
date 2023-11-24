import { ExecutionContext, HttpStatus, createParamDecorator } from "@nestjs/common";
import { DoWithException } from "src/do-with-exception/do-with-exception";
import { SelectQueryBuilder } from "typeorm";

export const PagingOptions = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): { page: number; limit: number } => {
    const req = ctx.switchToHttp().getRequest();
    const page = parseInt(req.query.page, 10) || 1;  
    const limit = parseInt(req.query.limit, 10) || 10;

    return { page, limit };
  }
);

export const applyPaging = <T>(
    queryBuilder: SelectQueryBuilder<T>
  , page: number
  , limit: number) => {
  const skip = (page - 1) * limit;
  
  return queryBuilder.take(limit)
                     .skip(skip)
                     .getManyAndCount();
}

export const getIdsFromItems = <T>(items: T[], idKey: string): any[] => {
  const ids = items.map(item => item[idKey]);

  if(ids.length == 0){
    throw new DoWithException('요청하신 데이터가 없습니다.', '1004', HttpStatus.BAD_REQUEST)
  }

  return ids;
};