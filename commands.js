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
  name: 'test',
  description: 'test command (checking ngrok protocall)',
  type: 1,
};

export const SPECTATE_COMMAND = {
  name: 'spectate',
  description: '[LSC-TOTO] 경기 관전 (100p 획득)',
  type: 1,
};

export const BET_COMMAND = {
  name: 'bet',
  description: '[LSC-TOTO] 베팅',
  type: 1,
};

export const REGISTER_MODAL_COMMAND = {
  name: 'register',
  description: '[LSC-TOTO] 회원가입',
  type: 1,
}

export const START_MODAL_COMMAND = {
  name: 'start',
  description: '(ADMIN) [LSC-GAME] start setting',
  type: 1,
}

export const INFO_COMMAND = {
  name: 'info',
  description: 'LSC-TOTO 사용자 정보 (본인)',
  type: 1,
}

export const END_COMMAND = {
  name: 'end',
  description: '(ADMIN) [LSC-GAME] stop bet system',
  type: 1
}

export const RETURN_COMMAND = {
  name: 'return',
  description: '(ADMIN) [LSC-GAME] end game & return bets',
  options: [
    {
        name: `game_name`,
        description: `(ADMIN) [LSC-GAME] game-name`,
        type: 3,
        required: true,
    },
    {
        name: `win_team`,
        description: `(ADMIN) [LSC-GAME] win-team`,
        type: 3,
        required: true,
    }
  ],
  type: 1
}