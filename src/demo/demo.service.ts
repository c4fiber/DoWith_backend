import { Injectable, Logger } from '@nestjs/common';
import { CreateDemoDto } from './dto/create-demo.dto';
import { UpdateDemoDto } from './dto/update-demo.dto';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Todo } from 'src/entities/todo.entity';
import { User } from 'src/entities/user.entities';
import { Attendance } from 'src/entities/attendance.entity';
import { UserAchi } from 'src/entities/user_achi.entity';
import { ItemInventory } from 'src/entities/item-inventory.entity';
import { Room } from 'src/entities/room.entity';

@Injectable()
export class DemoService {
  constructor(
      private readonly dataSource: DataSource,
  ){}
    async run(userId: number, dto: CreateDemoDto) {

        await this.dataSource.transaction(async (manager: EntityManager) => {
            const achiId = 6;
            const today: Date = new Date();
    
            // 1. 출결, 로그인 업적, 할일 삭제
            await manager.delete(Attendance, {user_id: userId});
            await manager.delete(UserAchi, {user_id: userId, achi_id: achiId});
            await manager.delete(Todo, { user_id: userId });

            // 2. 이전 6일의 출결 삽입
            let date = new Date();
            let dateString;
            for(let i = 0; i < 6; i++) {
                date.setDate(date.getDate() -1);
                dateString = this.toFormattedDate(date);
    
                await manager.insert(Attendance, {
                    user_id: userId,
                    atte_at: dateString,
                });
            }
            
            // 3. 유저 로그인 카운트 세팅
            await manager.createQueryBuilder()
                .update(User)
                .set({
                    user_cash: 400,
                    last_login: () => `CURRENT_TIMESTAMP - INTERVAL '1 day'`,
                    login_cnt : 6,
                    login_seq : 6,
                })
                .where(`user_id = :userId`,{userId})
                .execute();
                
            // 4. 데모용 개인 투두 삽입
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
                
                await manager.save(todo);
            }

            // 5. 인벤토리, 룸 비우기
            await manager.delete(ItemInventory, { user_id: userId });
            await manager.delete(Room, { user_id: userId });
    
            // 6. 인벤토리에 중간여우, 도마뱀, 중간새
            //    선물, 러그, 캔들 배치
            //    경험치를 진화 직전으로 세팅
            const midFox    = 2;
            const monitor   = 5;
            const bird      = 8;
            const rug       = 104;
            const present   = 103;
            const fireplace = 105;
            const candle    = 106;
            const petExp    = 1995;

            await manager.insert(ItemInventory, {   // 중간여우
                user_id: userId,
                item_id: bird,
                pet_name: '뺙뺙',
                pet_exp: 525,
            });
    
            await manager.insert(ItemInventory, {   // 중간여우
                user_id: userId,
                item_id: midFox,
                pet_name: '밍밍이',
                pet_exp: petExp,
            });
    
            await manager.insert(ItemInventory, {   // 도마뱀
                user_id: userId,
                item_id: monitor,
                pet_name: '구름이',
                pet_exp: 400,
            });
            
            // 가구들
            await manager.insert(ItemInventory, { user_id: userId, item_id: rug });
            await manager.insert(ItemInventory, { user_id: userId, item_id: candle });
            await manager.insert(ItemInventory, { user_id: userId, item_id: present });
            await manager.insert(ItemInventory, { user_id: userId, item_id: fireplace });
            
            // 룸에 도마뱀, 벽난로, 선물, 캔들 배치
            await manager.insert(Room, { user_id: userId, item_id: monitor });
            await manager.insert(Room, { user_id: userId, item_id: candle });
            await manager.insert(Room, { user_id: userId, item_id: present });
            await manager.insert(Room, { user_id: userId, item_id: fireplace });
    
    
            // 7. 가입한 그룹에 있는 더미 유저들의 투두 일자를 오늘로 조정
            for (const grpId of dto.groups) {
                await manager.createQueryBuilder()
                    .update(Todo)
                    .set({ todo_date: today })
                    .where("grp_id = :grpId AND user_id != :userId", { grpId, userId })
                    .execute();
            }
        });

        Logger.debug(`Setting for demo is completed. user id: ${userId}`);
    }

    // 시간 포맷
    private toFormattedDate(val: Date) {
        const year = val.getFullYear();
        const month = (val.getMonth() + 1).toString().padStart(2, '0');
        const date = val.getDate().toString().padStart(2, '0');

        return `${year}${month}${date}`;
    }
}
