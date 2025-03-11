import { createSlice } from "@reduxjs/toolkit";

const initialState = {
   user: null,
   isAuthenticated: false,
   hasSetInterests: false,
   loading: false,
   error: null,
};

const authSlice = createSlice({
   name: "auth",
   initialState,
   reducers: {
      setLoading: (state, action) => {
         state.loading = action.payload;
      },
      loginStart: (state) => {
         state.loading = true;
         state.error = null;
      },
      loginSuccess: (state, action) => {
         state.loading = false;
         state.isAuthenticated = true;
         state.user = action.payload.user;
         state.hasSetInterests = action.payload.user?.interests?.length > 0;
      },
      loginFailure: (state, action) => {
         state.loading = false;
         state.error = action.payload;
      },
      logout: (state) => {
         state.user = null;
         state.isAuthenticated = false;
         state.hasSetInterests = false;
         state.error = null;
         state.loading = false;
      },
      updateInterests: (state, action) => {
         if (state.user) {
            state.user.interests = action.payload;
            state.hasSetInterests = action.payload.length > 0;
         }
      },
   },
});

export const {
   loginStart,
   loginSuccess,
   loginFailure,
   logout,
   updateInterests,
   setLoading,
} = authSlice.actions;

export default authSlice.reducer;
