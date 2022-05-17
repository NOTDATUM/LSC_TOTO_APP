import mongoose from "mongoose";

export const UserSchema = new mongoose.Schema({
    student_name: { type: String, required: true},
    student_id: { type: Number, required: true },
    student_nick: { type: String, required: true },
    discord_id: { type: Number, required: true },
    point: { type: Number, required: true, default: 0 },
    spectate: { type: Boolean, required: true, default: true }
});

export const GameSchema = new mongoose.Schema({
    game_name: { type: String, required: true},
    game_blue_team_name: { type: String, required: true },
    game_red_team_name: { type: String, required: true },
    game_blue_team_point: { type: Number, required: true, default: 0 },
    game_red_team_point: { type: Number, required: true, default: 0 },
    game_isVaild: { type: Boolean, required: true },
});

export const BetSchema = new mongoose.Schema({
    bet_game_name: { type: String, required: true},
    bet_point: { type: Number, required: true },
    bet_team: { type: String, required: true },
    discord_id: { type: Number, required: true },
});