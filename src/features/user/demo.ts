import { Injectable } from "@nestjs/common";
import { Attendance } from "src/entities/attendance.entity";
import { ItemInventory } from "src/entities/item-inventory.entity";
import { Room } from "src/entities/room.entity";
import { Todo } from "src/entities/todo.entity";
import { User } from "src/entities/user.entities";
import { UserAchi } from "src/entities/user_achi.entity";
import { DataSource, Repository } from "typeorm";

@Injectable()
export class Demo {
    constructor(
        private readonly dataSource: DataSource,
    ){}

    async demo(userId:number) {
        const userRepo: Repository<User>          = this.dataSource.getRepository(User);
        const todoRepo: Repository<Todo>          = this.dataSource.getRepository(Todo);
        const atteRepo: Repository<Attendance>    = this.dataSource.getRepository(Attendance);
        const achiRepo: Repository<UserAchi>      = this.dataSource.getRepository(UserAchi);
        const inveRepo: Repository<ItemInventory> = this.dataSource.getRepository(ItemInventory);
        const roomRepo: Repository<Room>          = this.dataSource.getRepository(Room);

        const achiId = 6;

        // 1. 출결 모두 삭제, 로그인 업적 삭제
        await atteRepo.delete({user_id: userId});
        await achiRepo.delete({user_id: userId, achi_id: achiId});

        
        // 2. 오늘자 그룹 투두 삭제, 개인 투두 모두 false로 변경
        await todoRepo.createQueryBuilder()
            .delete()
            .where(`
                user_id  = :userId AND  \
                grp_id IS NOT NULL AND  \
                todo_date = DATE(now()) \
            `, {userId})
            .execute();

        await todoRepo.createQueryBuilder()
            .update()
            .where(`
                user_id   = :userId AND  \
                grp_id    IS NOT NULL    \
                todo_date = DATE(now())  \
            `, {userId})
            .execute();
        
        // 3. 이전 6일의 출결 삽입, 유저 로그인 정보 세팅
        let date = new Date();
        let dateString;
        for(let i = 0; i < 6; i++) {
            date.setDate(date.getDate() -1);
            dateString = this.toFormattedDate(date);

            await atteRepo.insert({
                user_id: userId,
                atte_at: dateString,
            });
        }

        
        await userRepo.createQueryBuilder()
        .update()
        .set({
            user_cash: 400,
            last_login: `to_char(now() - interval '1 day', 'yyyyMMdd')`,
            login_cnt : 6,
            login_seq : 6,
        })
        .execute();
        

        // 4. 인벤토리와 룸의 구미호 펫을 중간여우로 변경
        //    경험치를 진화 직전으로 세팅
        const kitsune = 3;
        const midFox  = 2;
        const tree    = 100;
        const rug     = 104;
        const petExp  = 1995;

        await inveRepo.update({
            user_id: userId,
            item_id: kitsune,
            pet_exp: petExp,
        }, {
            item_id: midFox,
        });

        await roomRepo.update({
            user_id: userId,
            item_id: kitsune,
        }, {
            item_id: midFox,
        });

        // 5. 트리와 러그 룸에서 삭제
        await roomRepo.createQueryBuilder()
            .delete()
            .where(`
                user_id = :userId AND \
                (
                    item_id = :tree   OR  \
                    item_id = :rug
                )
            `, {userId, tree, rug})
            .execute();

            
        // 6. 트리는 인벤토리에서 삭제
        await inveRepo.delete({
            user_id: userId,
            item_id: tree,
        })
    }

    private toFormattedDate(val: Date) {
        const year = val.getFullYear() % 100;
        const month = (val.getMonth() + 1).toString().padStart(2, '0');
        const date = val.getDate().toString().padStart(2, '0');

        return `${year}${month}${date}`;
    }
}