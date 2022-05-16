import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import {
  InteractionType,
  InteractionResponseType,
  InteractionResponseFlags,
  MessageComponentTypes,
  ButtonStyleTypes,
} from 'discord-interactions';
import { 
  VerifyDiscordRequest, 
  DiscordRequest, 
  EditDashBoard,
  MakeProgressBar,
} from './utils.js';
import {
  BET_COMMAND,
  HELLO_COMMAND,
  HasGuildCommands,
  REGISTER_MODAL_COMMAND,
  SPECTATE_COMMAND,
  START_MODAL_COMMAND,
  INFO_COMMAND,
  END_COMMAND,
  RETURN_COMMAND,
} from './commands.js';
import {
  UserSchema,
  GameSchema,
  BetSchema,
} from './model.js'
import {
  COLOR_BLACK,
  COLOR_GREEN,
  COLOR_RED,
} from './color.js'

const app = express();
const PORT = process.env.PORT;

mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Successfully connected to mongodb'))
  .catch(e => console.error(e));
const User = mongoose.model('User', UserSchema);
const Game = mongoose.model('Game', GameSchema);
const Bet = mongoose.model('Bet', BetSchema);

app.use(express.json({ verify: VerifyDiscordRequest(process.env.PUBLIC_KEY) }));

app.post('/interactions', async function (req, res) {
  const { type, id, data } = req.body;
  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }

  if (type === InteractionType.APPLICATION_COMMAND) {
    const { name } = data;

    if (name === 'hello') {
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: '안녕하세요! 개발자 <@447617660562309130>입니다! 👋',
        },
      });
    }

    if (name === 'spectate') {
      const userId = req.body.member.user.id;
      User.findOne({'discord_id': userId}, function(err, target_user){
        if (!target_user) {
          return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: '/register을 통해 회원가입을 해주세요.',
              flags: InteractionResponseFlags.EPHEMERAL,
            }
          });
        } else {
          if (target_user.spectate) {
            target_user.point = target_user.point + 100;
            target_user.spectate = false;
            target_user.save();
            return res.send({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: `관전으로 100 포인트가 지급되었습니다.`,
                flags: InteractionResponseFlags.EPHEMERAL,
              }
            });
          } else {
            return res.send({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: `관전 가능 시간이 아니거나 이미 포인트가 지급되었습니다.`,
                flags: InteractionResponseFlags.EPHEMERAL,
              }
            });
          }
        }
      });
    }

    if (name === 'bet') {
      const userId = req.body.member.user.id;
      User.findOne({'discord_id': userId}, function(err, target_user){
        if (!target_user) {
          return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: '/register을 통해 회원가입을 해주세요.',
              flags: InteractionResponseFlags.EPHEMERAL,
            }
          });
        } else {
          Game.findOne({'game_isVaild': true}, function(err, target_game){
            if (!target_game) {
              return res.send({
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                  content: '아직 게임이 시작되지 않았습니다. 게임이 시작될 때까지 기다려주세요.',
                  flags: InteractionResponseFlags.EPHEMERAL,
                }
              });
            } else {
              return res.send({
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                  content: `${target_game.game_name}에서 승리할 것으로 예상되는 팀을 선택해주세요.`,
                  flags: InteractionResponseFlags.EPHEMERAL,
                  components: [
                    {
                      type: MessageComponentTypes.ACTION_ROW,
                      components: [
                        {
                          type: MessageComponentTypes.STRING_SELECT,
                          custom_id: `team`,
                          options: [
                            { 
                              label: `${target_game.game_blue_team_name}`, 
                              value: `${target_game.game_blue_team_name} (블루팀)`, 
                              description: '블루팀 승리 예상' 
                            },
                            { 
                              label: `${target_game.game_red_team_name}`, 
                              value: `${target_game.game_red_team_name} (레드팀)`, 
                              description: '레드팀 승리 예상' 
                            }
                          ],
                        },
                      ],
                    },
                  ],
                },
              });
            }
          });
        }
      })
    }

    if (name === 'info') {
      const userId = req.body.member.user.id;
      User.findOne({'discord_id': userId}, function(err, target_user){
        if (!target_user) {
          return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: '/register을 통해 회원가입을 해주세요.',
              flags: InteractionResponseFlags.EPHEMERAL,
            }
          });
        } else {
          return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: `${target_user}`,
              flags: InteractionResponseFlags.EPHEMERAL,
            }
          });
        }
      });
    }

    if (data.name === 'register') {   
      const userId = req.body.member.user.id;
      const is_user_registered = await User.exists({'discord_id': userId});
      if (is_user_registered){
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: `이미 등록된 사용자입니다.`,
            flags: InteractionResponseFlags.EPHEMERAL,
          }
        })
      } else {
        return res.send({
          type: InteractionResponseType.APPLICATION_MODAL,
          data: {
            custom_id: 'register_modal',
            title: 'LSC 승부예측 회원가입 시스템',
            components: [
              {
                type: MessageComponentTypes.ACTION_ROW,
                components: [
                  {
                    type: MessageComponentTypes.INPUT_TEXT,
                    custom_id: '등록된 이름',
                    style: 1,
                    label: '이름 입력 - 예) 김선웅',
                    min_length: 2,
                    max_length: 4, 
                    require: true,
                  },
                ],
              },
              {
                type: MessageComponentTypes.ACTION_ROW,
                components: [
                  {
                    type: MessageComponentTypes.INPUT_TEXT,
                    custom_id: '등록된 교번',
                    style: 1,
                    label: '교번 입력 - 예) 21012',
                    min_length: 5,
                    max_length: 5, 
                    require: true,
                  },
                ],
              },
              {
                type: MessageComponentTypes.ACTION_ROW,
                components: [
                  {
                    type: MessageComponentTypes.INPUT_TEXT,
                    custom_id: '등록된 롤 닉네임',
                    style: 1,
                    label: '롤 닉네임 입력 - 예) PSYSICIAN',
                    max_length: 100,
                  },
                ],
              },
            ],
          },
        })
      };
    }

    if (data.name === 'start') {   
      const userId = req.body.member.user.id;
      if (!(userId === process.env.ADMIN)){
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: `관리자 전용 명령어입니다.`,
            flags: InteractionResponseFlags.EPHEMERAL,
          }
        })
      } else {  
        return res.send({
          type: InteractionResponseType.APPLICATION_MODAL,
          data: {
            custom_id: 'start_modal',
            title: 'LSC 게임 시작 설정',
            components: [
              {
                type: MessageComponentTypes.ACTION_ROW,
                components: [
                  {
                    type: MessageComponentTypes.INPUT_TEXT,
                    custom_id: 'LSC 게임명',
                    style: 1,
                    label: '게임명 - 예) LSC-4강A-1경기',
                    max_length: 100, 
                    require: true,
                  },
                ],
              },
              {
                type: MessageComponentTypes.ACTION_ROW,
                components: [
                  {
                    type: MessageComponentTypes.INPUT_TEXT,
                    custom_id: '블루팀',
                    style: 1,
                    label: '블루팀명 입력 - 예) 4시간도 안걸리노',
                    max_length: 100, 
                    require: true,
                  },
                ],
              },
              {
                type: MessageComponentTypes.ACTION_ROW,
                components: [
                  {
                    type: MessageComponentTypes.INPUT_TEXT,
                    custom_id: '레드팀',
                    style: 1,
                    label: '레드팀명 입력 - 예) 4시간도 안걸리노',
                    max_length: 100, 
                    require: true,
                  },
                ],
              },
            ],
          },
        })
      };
    }

    if (name === 'end') {
      const userId = req.body.member.user.id;
      if (!(userId === process.env.ADMIN)){
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: `관리자 전용 명령어입니다.`,
            flags: InteractionResponseFlags.EPHEMERAL,
          }
        });
      } else {
        Game.findOne({'game_isVaild': true}, function(err, target_game){
          target_game.game_isVaild = false
          target_game.save()
          const total_point = target_game.game_blue_team_point + target_game.game_red_team_point
          const blue_perc = target_game.game_blue_team_point / total_point * 100
          EditDashBoard(target_game.game_name, `베팅 종료`, target_game.game_blue_team_name, target_game.game_red_team_name, MakeProgressBar(blue_perc), blue_perc.toFixed(2), (total_point / target_game.game_blue_team_point).toFixed(2), target_game.game_blue_team_point, (100 - blue_perc.toFixed(2)).toFixed(2), (total_point / target_game.game_red_team_point).toFixed(2), target_game.game_red_team_point, COLOR_RED)
          return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: `${target_game}`,
              flags: InteractionResponseFlags.EPHEMERAL,
            }
          });
        });
      }
    }

    if (name === 'return') {
      const userId = req.body.member.user.id;
      if (!(userId === process.env.ADMIN)){
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: `관리자 전용 명령어입니다.`,
            flags: InteractionResponseFlags.EPHEMERAL,
          }
        });
      } else {
        await User.updateMany({spectate: true}, {spectate: false});
        Game.findOne({'game_name': data.options[0].value}, function(err, target_game){
          if (data.options[1].value == target_game.game_blue_team_name) {
            Bet.find({'bet_game_name': data.options[0].value}, function(err, target_bets){
              var index = 0;
              while (index < target_bets.length) {
                const bet = target_bets[index]
                if (bet.bet_team == `(블루팀)`) {
                  User.findOne({'discord_id': bet.discord_id}, async function(err, target_user) {
                    target_user.point = target_user.point + (bet.bet_point * (target_game.game_red_team_point / target_game.game_blue_team_point + 1)).toFixed(0)
                    await target_user.save()
                  })
                }
                index = index + 1;
              }
            })
          } else {
            Bet.find({'bet_game_name': data.options[0].value}, function(err, target_bets){
              var index = 0;
              while (index < target_bets.length) {
                const bet = target_bets[index]
                if (bet.bet_team == `(레드팀)`) {
                  User.findOne({'discord_id': bet.discord_id}, async function(err, target_user) {
                    target_user.point = target_user.point + (bet.bet_point * (target_game.game_blue_team_point / target_game.game_red_team_point + 1))
                    await target_user.save()
                  })
                }
                index = index + 1;
              }
            })
          }
          const total_point = target_game.game_blue_team_point + target_game.game_red_team_point
          const blue_perc = target_game.game_blue_team_point / total_point * 100
          EditDashBoard(target_game.game_name, `경기 종료`, target_game.game_blue_team_name, target_game.game_red_team_name, MakeProgressBar(blue_perc), blue_perc.toFixed(2), (total_point / target_game.game_blue_team_point).toFixed(2), target_game.game_blue_team_point, (100 - blue_perc.toFixed(2)).toFixed(2), (total_point / target_game.game_red_team_point).toFixed(2), target_game.game_red_team_point, 0)
          return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: `(관리자) 정상적으로 처리되었습니다.`,
              flags: InteractionResponseFlags.EPHEMERAL,
            }
          });
        });
      }
    }
  }

  if (type === InteractionType.MESSAGE_COMPONENT) {
    const componentId = data.custom_id;

    if (componentId === `team`) {
      const endpoint = `webhooks/${process.env.APP_ID}/${req.body.token}/messages/${req.body.message.id}`;
      const select_team = data.values[0]
      try {
        await res.send({
          type: InteractionResponseType.APPLICATION_MODAL,
          data: {
            custom_id: 'bet_modal',
            title: 'LSC 승부예측 시스템',
            components: [
              {
                type: MessageComponentTypes.ACTION_ROW,
                components: [
                  {
                    type: MessageComponentTypes.INPUT_TEXT,
                    custom_id: select_team,
                    style: 1,
                    label: '베팅할 금액 입력',
                    max_length: 5, 
                    require: true,
                  },
                ],
              },
            ], 
          },
        });
        await DiscordRequest(endpoint, {
          method: 'PATCH',
          body: {
            flags: InteractionResponseFlags.EPHEMERAL,
            content: `중복 베팅 방지 (본 메세지는 닫아도 좋습니다.)`,
            components: [],
          },
        });
      } catch (err) {
        console.error('Error: ', err);
      }
    } 

    if (componentId.startsWith('bet_button_')) {
      const button_type = componentId.replace('bet_button_', '');
      const endpoint = `webhooks/${process.env.APP_ID}/${req.body.token}/messages/${req.body.message.id}`;
      const userId = req.body.member.user.id;
      User.findOne({'discord_id': userId}, async function(err, target_user){
        Game.findOne({'game_isVaild': true}, async function(err, target_game){
          if (button_type === 'cancel') {
            await res.send({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                flags: InteractionResponseFlags.EPHEMERAL,
                content: `다시 베팅해주세요.`,
              }
            });
            await DiscordRequest(endpoint, {
              method: 'PATCH',
              body: {
                flags: InteractionResponseFlags.EPHEMERAL,
                content: `취소되었습니다. (본 메세지는 닫아도 좋습니다.)`,
                components: [],
              },
            });
          } else {
            const bet_info = button_type.split('_')

            const new_bet = new Bet({
              bet_game_name: target_game.game_name,
              bet_point: Number(bet_info[1]),
              bet_team: bet_info[0].split(' ')[bet_info[0].split(' ').length - 1],
              discord_id: userId,
            });
            new_bet.save()

            target_user.point = target_user.point - Number(bet_info[1]);
            target_user.save()

            if (bet_info[0].split(' ')[bet_info[0].split(' ').length - 1] == `(블루팀)`) {
              target_game.game_blue_team_point = target_game.game_blue_team_point + Number(bet_info[1]);
            } else {
              target_game.game_red_team_point = target_game.game_red_team_point + Number(bet_info[1]);
            }
            target_game.save()
            
            const total_point = target_game.game_blue_team_point + target_game.game_red_team_point
            const blue_perc = target_game.game_blue_team_point / total_point * 100
            EditDashBoard(target_game.game_name, `베팅 가능`, target_game.game_blue_team_name, target_game.game_red_team_name, MakeProgressBar(blue_perc), blue_perc.toFixed(2), (total_point / target_game.game_blue_team_point).toFixed(2), target_game.game_blue_team_point, (100 - blue_perc.toFixed(2)).toFixed(2), (total_point / target_game.game_red_team_point).toFixed(2), target_game.game_red_team_point, COLOR_GREEN)

            await res.send({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                flags: InteractionResponseFlags.EPHEMERAL,
                content: `성공적으로 베팅되었습니다.`,
              }
            });
            await DiscordRequest(endpoint, {
              method: 'PATCH',
              body: {
                flags: InteractionResponseFlags.EPHEMERAL,
                content: `정상적으로 처리되었습니다. (본 메세지는 닫아도 좋습니다.)`,
                components: [],
              },
            });
          }
        });
      });
    }
  }

  if (type === InteractionType.APPLICATION_MODAL_SUBMIT) {
    const modalId = data.custom_id;
    const userId = req.body.member.user.id;

    if (modalId === 'bet_modal') {
      User.findOne({'discord_id': userId}, function(err, target_user){
        Game.findOne({'game_isVaild': true}, function(err, target_game){
          if (target_user.point < data.components[0].components[0].value || data.components[0].components[0].value <= 0) {
            return res.send({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                flags: InteractionResponseFlags.EPHEMERAL,
                content: `베팅 금액이 유효하지 않거나 보유한 잔여 포인트가 부족합니다.`,
              }
            });
          } else {
            return res.send({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                flags: InteractionResponseFlags.EPHEMERAL,
                content: `**베팅 정보 확인**\n\n베팅할 팀: ${data.components[0].components[0].custom_id}\n베팅 금액: ${data.components[0].components[0].value}`,
                components: [
                  {
                    type: MessageComponentTypes.ACTION_ROW,
                    components: [
                      {
                        type: MessageComponentTypes.BUTTON,
                        custom_id: `bet_button_${data.components[0].components[0].custom_id}_${data.components[0].components[0].value}`,
                        label: '확인',
                        style: ButtonStyleTypes.SUCCESS,
                      },
                      {
                        type: MessageComponentTypes.BUTTON,
                        custom_id: 'bet_button_cancel',
                        label: '취소',
                        style: ButtonStyleTypes.DANGER,
                      },
                    ],
                  },
                ],
              }
            });
          }
        });
      });
    }

    if (modalId === 'register_modal') {
      let modalValues = '';
      for (let action of data.components) {
        let inputComponent = action.components[0];
        modalValues += `${inputComponent.custom_id}: ${inputComponent.value}\n`;
      }
      const new_user = new User({
        student_name: data.components[0].components[0].value,
        student_id: data.components[1].components[0].value,
        student_nick: data.components[2].components[0].value,
        discord_id: userId,
        point: 0,
        spectate: false,
      });
      new_user.save().then(() => console.log('User saved successfully'));

      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          flags: InteractionResponseFlags.EPHEMERAL,
          content: `다음이 등록되었습니다. 잘못 입력한 항목이 있을경우 서누#2102로 DM하시면 됩니다. 추후 보상 지급시 불이익이 없도록 정확하게 입력하였는지 확인바랍니다. (본 메세지는 닫아도 좋습니다.)\n\n${modalValues}`,
        },
      });
    }

    if (modalId === 'start_modal') {
      await User.updateMany({spectate: false}, {spectate: true}) 
      EditDashBoard(data.components[0].components[0].value, `베팅 가능`, data.components[1].components[0].value, data.components[2].components[0].value, `⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜`, `0`, `0`, `0`, `0`, `0`, `0`, COLOR_GREEN)

      let modalValues = '';
      for (let action of data.components) {
        let inputComponent = action.components[0];
        modalValues += `${inputComponent.custom_id}: ${inputComponent.value}\n`;
      }

      const new_game = new Game({
        game_name: data.components[0].components[0].value,
        game_blue_team_name: data.components[1].components[0].value,
        game_red_team_name: data.components[2].components[0].value,
        game_blue_team_point: 0,
        game_red_team_point: 0,
        game_isVaild: true,
      });
      new_game.save().then(() => console.log('Game saved successfully'));

      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          flags: InteractionResponseFlags.EPHEMERAL,
          content: `다음이 등록되었습니다.\n\n${modalValues}`,
        },
      });
    }
  }
});

app.listen(PORT, () => {
  console.log('Listening on port', PORT);

  HasGuildCommands(process.env.APP_ID, process.env.GUILD_ID, [
    HELLO_COMMAND,
    BET_COMMAND,
    REGISTER_MODAL_COMMAND,
    SPECTATE_COMMAND,
    START_MODAL_COMMAND,
    INFO_COMMAND,
    END_COMMAND,
    RETURN_COMMAND,
  ]);
});