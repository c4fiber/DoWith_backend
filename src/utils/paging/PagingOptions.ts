import { ExecutionContext, Logger, createParamDecorator } from "@nestjs/common";
import { QueryBuilder, SelectQueryBuilder } from "typeorm";

export const PagingOptions = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
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