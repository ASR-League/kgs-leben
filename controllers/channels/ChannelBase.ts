/// <reference path="../ControllerBase.ts" />

namespace Controllers {
    export abstract class ChannelBase extends ControllerBase<ChannelController> {
        private _channelId: number;
        private _activated: boolean;

        private _gameList: Views.GameList;
        private _chat: Views.ChatForm;

        constructor(parent: ChannelController, channelId: number) {
            super(parent);
            this._channelId = channelId;
            this._activated = false;
        }

        protected digest(digest: KGS.DataDigest) {
            if (this._activated) {
                if (digest.channelGames[this.channelId]) this.updateGameList();
                if (digest.channelChat[this.channelId]) this.updateChatMessages();
                if (digest.channelUsers[this.channelId]) this.updateChatMembers();
            }
        }

        public get channelId(): number {
            return this._channelId;
        }

        public get channel(): Models.Channel {
            return this.database.channels[this._channelId];
        }

        public activate(): boolean {
            if (this._activated) return false;

            if (this._gameList != null) {
                this.application.layout.showMain(this._gameList);
            }
            else {
                this.application.layout.clearMain();
            }

            if (this._chat != null) {
                this.application.layout.showSidebar(this._chat);
            }
            else {
                this.application.layout.clearSidebar();
            }

            this._activated = true;

            this.updateGameList();
            this.updateChatMessages();
            this.updateChatMembers();

            return true;
        }

        public deactivate(): boolean {
            if (!this._activated) return false;
            this._activated = false;
            return true;
        }

        public get activated(): boolean {
            return this._activated;
        }

        public get gameList(): Views.GameList {
            return this._gameList;
        }

        protected initialiseGameList() {
            this._gameList = document.createElement('game-list') as Views.GameList;
        }

        private updateGameList() {
            if ((!this._activated) || (this._gameList == null)) return;
            this._gameList.update(this.database.channels as { [key: string]: Models.GameChannel }, (<Models.RoomChannel>this.channel).games, (cid) => this.parent.joinChannel(cid));
        }

        public get chat(): Views.ChatForm {
            return this._chat;
        }

        protected initialiseChat() {
            this._chat = document.createElement('chat-form') as Views.ChatForm;
            this._chat.submitCallback = (form) => this.submitChatMessage(form);
        }

        private updateChatMessages() {
            if ((!this._activated) || (this._chat == null)) return;
            this._chat.messageList.update(this.channel.chats);
        }
        private updateChatMembers() {
            if ((!this._activated) || (this._chat == null)) return;
            this._chat.memberList.update(this.database.users, this.channel.users);
        }

        private submitChatMessage(chatForm: Views.ChatForm) {
            let text = chatForm.message;
            if ((text) && (text.length > 0) && (text.length <= KGS.Upstream._CHAT_MaxLength)) {
                this.client.post(<KGS.Upstream.CHAT>{
                    type: KGS.Upstream._CHAT,
                    channelId: this._channelId,
                    text:text
                });

                chatForm.message = "";
                chatForm.focus();
            }
        }
    }
}