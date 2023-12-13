import { Injectable } from "@nestjs/common";
import { Attendance } from "src/entities/attendance.entity";
import { ItemInventory } from "src/entities/item-inventory.entity";
import { Room } from "src/entities/room.entity";
import { Todo } from "src/entities/todo.entity";
import { User } from "src/entities/user.entities";
import { UserAchi } from "src/entities/user_achi.entity";
import { DataSource, Repository } from "typeorm";
import { CreateTodoDto } from "../todo/dto/create-todo.dto";

@Injectable()
export class Demo {
    constructor(
        private readonly dataSource: DataSource,
    ){}

    async run(userId:number) {
        const userRepo: Repository<User>          = this.dataSource.getRepository(User);
        const todoRepo: Repository<Todo>          = this.dataSource.getRepository(Todo);
        const atteRepo: Repository<Attendance>    = this.dataSource.getRepository(Attendance);
        const achiRepo: Repository<UserAchi>      = this.dataSource.getRepository(UserAchi);
        const inveRepo: Repository<ItemInventory> = this.dataSource.getRepository(ItemInventory);
        const roomRepo: Repository<Room>          = this.dataSource.getRepository(Room);

        const achiId = 6;
        const today: Date = new Date();

        // 1. 출결 모두 삭제, 로그인 업적 삭제
        await atteRepo.delete({user_id: userId});
        await achiRepo.delete({user_id: userId, achi_id: achiId});

        
        // 2. 오늘자 투두 모두 삭제
        await todoRepo.createQueryBuilder('todo')
            .delete()
            .where(`
                user_id  = :userId AND              \
                DATE(todo.todo_date) = DATE(:today) \
            `, {userId, today})
            .execute();


        // 3. 이전 6일의 출결 삽입
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
        
        // 4. 유저 로그인 카운트 세팅
        await userRepo.createQueryBuilder()
            .update()
            .set({
                user_cash: 400,
                last_login: () => `CURRENT_TIMESTAMP - INTERVAL '1 day'`,
                login_cnt : 6,
                login_seq : 6,
            })
            .where(`
                user_id = :userId
            `, {userId})
            .execute();
        

        // 5. 데모용 개인 투두 삽입
        const demoTodo = [
            {
                "user_id": userId,
                "todo_name": "나만의 무기 만들기 최종발표",
                "todo_desc": "유종의 미를 거두자",
                "todo_date": today,
                "todo_done": false,
                "todo_start": "13:00:00",
            },
            {
                "user_id": userId,
                "todo_name": "저녁 약속",
                "todo_desc": "",
                "todo_date": today,
                "todo_done": false,
                "todo_start": "18:00:00",
            },
            {
                "user_id": userId,
                "todo_name": "자기전 알고리즘 1문제",
                "todo_desc": "",
                "todo_date": today,
                "todo_done": false,
                "todo_start": "22:00:00",
            },
        ];

        for(let newTodo of demoTodo) {
            const todo = new Todo();
            todo.user_id = newTodo['user_id'];
            todo.todo_name = newTodo['todo_name'];
            todo.todo_desc = newTodo['todo_desc'];
            todo.todo_date = newTodo['todo_date'];
            todo.todo_done = newTodo['todo_done'];
            todo.todo_start = newTodo['todo_start'];
            
            await todoRepo.save(todo);
        }
        

        // 6. 인벤토리와 룸의 구미호 펫을 중간여우로 변경
        //    경험치를 진화 직전으로 세팅
        const kitsune = 3;
        const midFox  = 2;
        const tree    = 100;
        const rug     = 104;
        const petExp  = 1995;

        await inveRepo.update({
            user_id: userId,
            item_id: kitsune,
        }, {
            item_id: midFox,
            pet_exp: petExp,
        });

        await roomRepo.update({
            user_id: userId,
            item_id: kitsune,
        }, {
            item_id: midFox,
        });

        // 7. 트리와 러그 룸에서 삭제
        await roomRepo.createQueryBuilder()
            .delete()
            .where(`
                user_id = :userId AND     \
                (
                    item_id = :tree   OR  \
                    item_id = :rug
                )
            `, {userId, tree, rug})
            .execute();

            
        // 트리는 인벤토리에서 삭제
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