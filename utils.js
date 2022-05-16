import 'dotenv/config';
import fetch from 'node-fetch';
import { verifyKey } from 'discord-interactions';

export function VerifyDiscordRequest(clientKey) {
  return function (req, res, buf, encoding) {
    const signature = req.get('X-Signature-Ed25519');
    const timestamp = req.get('X-Signature-Timestamp');

    const isValidRequest = verifyKey(buf, signature, timestamp, clientKey);
    if (!isValidRequest) {
      res.status(401).send('Bad request signature');
      throw new Error('Bad request signature');
    }
  };
}

export async function DiscordRequest(endpoint, options) {
  const url = 'https://discord.com/api/v9/' + endpoint;
  if (options.body) options.body = JSON.stringify(options.body);
  const res = await fetch(url, {
    headers: {
      Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
      'Content-Type': 'application/json; charset=UTF-8',
    },
    ...options
  });
  if (!res.ok) {
    const data = await res.json();
    console.log(res.status);
    throw new Error(JSON.stringify(data));
  }
  return res;
}

export function EditDashBoard(title, bet_status, blue_team_name, red_team_name, progress_bar, blue_perc, blue_rate, blue_point, red_perc, red_rate, red_point, color) {
  const endpoint = `/channels/975319344902995988/messages/975327107058110484`
  DiscordRequest(endpoint, {
    method: 'PATCH',
    body: {
      embeds: [{
        author: {
          name: 'DASHBOARD'
        },
        title: `${title}`,
        description: `현재 상태: ${bet_status}`,
        url: `https://twitch.com/`,
        fields: [
          {
            name: `BLUE`,
            value: `${blue_team_name}`,
            inline: true, 
          },
          {
            name: `ㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤ`,
            value: `ㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤ`,
            inline: true, 
          },
          {
            name: `RED`,
            value: `${red_team_name}`,
            inline: true, 
          },
          {
            name: `${progress_bar}`, //🟦🟦🟦🟦🟦🟦🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥
            value: `ㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤPROGRESS BARㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤ`,
            inline: false, 
          },
          {
            name: `${blue_perc}% (${blue_point})`,
            value: `배율: ${blue_rate}`,
            inline: true, 
          },
          {
            name: `ㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤ`,
            value: `ㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤ`,
            inline: true, 
          },
          {
            name: `${red_perc}% (${red_point})`,
            value: `배율: ${red_rate}`,
            inline: true, 
          },
        ],
        color: `${color}` 
      }],
    },
  });
}

export function MakeProgressBar(blue_perc) {
  const blue_block = (27 / 100 * blue_perc).toFixed(0)
  const red_block = 27 - blue_block
  return `${'🟦'.repeat(blue_block)}${'🟥'.repeat(red_block)}`
}