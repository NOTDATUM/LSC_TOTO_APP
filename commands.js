import { DiscordRequest } from './utils.js';

export async function HasGuildCommands(appId, guildId, commands) {
  if (guildId === '' || appId === '') return;

  commands.forEach((c) => HasGuildCommand(appId, guildId, c));
}

async function HasGuildCommand(appId, guildId, command) {
  const endpoint = `applications/${appId}/guilds/${guildId}/commands`;
  try {
    const res = await DiscordRequest(endpoint, { method: 'GET' });
    const data = await res.json();

    if (data) {
      const installedNames = data.map((c) => c['name']);
      if (!installedNames.includes(command['name'])) {
        console.log(`Installing "${command['name']}"`);
        InstallGuildCommand(appId, guildId, command);
      } else {
        console.log(`"${command['name']}" command already installed`);
      }
    }
  } catch (err) {
    console.error(err);
  }
}

export async function InstallGuildCommand(appId, guildId, command) {
  const endpoint = `applications/${appId}/guilds/${guildId}/commands`;
  try {
    await DiscordRequest(endpoint, { method: 'POST', body: command });
  } catch (err) {
    console.error(err);
  }
}

export const HELLO_COMMAND = {
  name: 'hello',
  description: 'Hello World!',
  type: 1,
};

export const SPECTATE_COMMAND = {
  name: 'spectate',
  description: '경기 관전 (100포인트)',
  type: 1,
};

export const BET_COMMAND = {
  name: 'bet',
  description: 'LSC 승부예측 베팅',
  type: 1,
};

export const REGISTER_MODAL_COMMAND = {
  name: 'register',
  description: 'LSC 승부예측 회원가입',
  type: 1,
}

export const START_MODAL_COMMAND = {
  name: 'start',
  description: '(관리자) LSC 게임 시작 설정',
  type: 1,
}

export const INFO_COMMAND = {
  name: 'information',
  description: '사용자 정보 확인',
  type: 1,
}

export const END_COMMAND = {
  name: 'end',
  description: '(관리자) LSC 베팅 가능 시간 종료',
  type: 1
}

export const RETURN_COMMAND = {
  name: 'return',
  description: '(관리자) LSC 게임 종료 및 베팅 결과 리턴',
  options: [
    {
        name: `game_name`,
        description: `결과를 조회할 LSC 게임 선정`,
        type: 3,
        required: true,
    },
    {
        name: `win_team`,
        description: `승리팀 설정`,
        type: 3,
        required: true,
    }
  ],
  type: 1
}