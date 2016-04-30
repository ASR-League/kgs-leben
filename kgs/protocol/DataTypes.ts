namespace KGS {
    export interface Message {
        type: string
    }

    export interface ChannelMessage extends Message {
        channelId: number
    }

    export interface CallbackMessage extends Message {
        callbackId: number
    }

    export interface User {
        name: string,
        flags?: string,
        rank?: string
    }

    export interface GameUserMap {              // An object mapping roles to user objects, telling who was in the game.

        white?: User,
        black?: User,
        white_2?: User,
        black_2?: User,
        challengeCreator?: User,                // TODO: Add support for this user when the game is still a challenge
        owner?: User
    }

    export interface GameSummary {
        size: number,           // The size of the board from this game.
        timestamp: string,      // The time stamp of when this game was started. This is also used as a serverwide ID for the game; no two games will ever have the same timestamp, and the time stamp is used to refer to the game summary.
        gameType: string,       // One of demonstration, review, rengo_review, teaching, simul, rengo, free, ranked, or tournament.
        score?: string,         // The result of the game. Not present if the game hasn't ended yet.
        revision?: number,      // The revision is used when downloading an SGF file.
        players?: GameUserMap,
        tag?: any,              // Only present in tag archives. The tag associated with the game summary.
        private?: boolean,      // If set, this is a private game.
        inPlay?: boolean        // If set, the game is currently in play.
    }

    export interface GameChannelRules {
        size: number,
        handicap?: number,
        komi: number
    }
    export interface GameRules extends GameChannelRules {
        rules: "japanese" | "chinese" | "aga" | "new_zealand",
        timeSystem: "none" | "absolute" | "byo_yomi" | "canadian",
        mainTime?: number,
        byoYomiTime?: number,
        byoYomiPeriods?: number,
        byoYomiStones?: number
    }

    export interface GameFlags {
        "over"?: boolean,           // If set, it means that the game has been scored.
        "adjourned"?: boolean,      // The game cannot continue because the player whose turn it is has left.
        "private"?: boolean,        // Only users specified by the owner are allowed in.
        "subscribers"?: boolean,    // Only KGS Plus subscribers are allowed in.
        "event"?: boolean,          // This game is a server event, and should appear at the top of game lists.
        "uploaded"?: boolean,       // This game was created by uploading an SGF file.
        "audio"?: boolean,          // This game includes a live audio track.
        "paused"?: boolean,         // The game is paused. Tournament games are paused when they are first created, to give players time to join before the clocks start.
        "named"?: boolean,          // This game has a name (most games are named after the players involved). In some cases, instead of seeing this flag when it is set, a text field name will appear instead.
        "saved"?: boolean,          // This game has been saved to the KGS archives. Most games are saved automatically, but demonstration and review games must be saved by setting this flag.
        "global"?: boolean          // This game may appear on the open or active game lists.
    }

    export interface GameProposalPlayer {
        role: "white" | "black" | "white_2" | "black_2" | "challengeCreator" | "owner",
        handicap?: number,          // (only for simultaneous games)
        komi?: number               // (only for simultaneous games)
    }
    export interface DownstreamProposalPlayer extends GameProposalPlayer {
        user?: KGS.User
    }
    export interface UpstreamProposalPlayer extends GameProposalPlayer {
        name: string
    }

    export interface GameProposal extends GameFlags {
        gameType: string,
        nigiri?: boolean
    }
    export interface DownstreamProposal extends GameProposal, GameRules {
        players: DownstreamProposalPlayer[]
    }
    export interface UpstreamProposal extends GameProposal {
        rules: KGS.GameRules,
        players: UpstreamProposalPlayer[]
    }

    export interface GameChannelBase extends GameFlags {
        channelId: number,
        gameType: string,
        roomId: number
        name?: string,
        players?: GameUserMap
    }
    export interface GameChannel extends GameChannelBase, GameChannelRules {
        score?: string,
        moveNum: number
    }
    export interface ChallengeChannel extends KGS.GameChannelBase {
        gameType: "challenge",
        initialProposal: DownstreamProposal,
    }
}
