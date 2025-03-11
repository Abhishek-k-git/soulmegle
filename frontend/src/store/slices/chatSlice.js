import { createSlice } from "@reduxjs/toolkit";

const initialState = {
   currentPartner: null,
   messages: [],
   isSearching: false,
};

const chatSlice = createSlice({
   name: "chat",
   initialState,
   reducers: {
      setPartner: (state, action) => {
         state.currentPartner = action.payload;
         state.isSearching = false;
      },
      addMessage: (state, action) => {
         state.messages.push(action.payload);
      },
      clearChat: (state) => {
         state.currentPartner = null;
         state.messages = [];
      },
      setSearching: (state, action) => {
         state.isSearching = action.payload;
      }
   },
});

export const {
   setPartner,
   addMessage,
   clearChat,
   setSearching,
} = chatSlice.actions;
export default chatSlice.reducer;
