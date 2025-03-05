import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginSuccess, logout, setLoading } from "../store/slices/authSlice";
import { user } from "../services/api";

const useAuth = () => {
   const dispatch = useDispatch();
   const { loading } = useSelector((state) => state.auth);

   useEffect(() => {
      const checkAuth = async () => {
         dispatch(setLoading(true));
         try {
            const response = await user.getProfile();
            if (response.data && response.data._id) {
               dispatch(loginSuccess({ user: response.data }));
            } else {
               throw new Error("Invalid token");
            }
         } catch (error) {
            dispatch(logout());
         } finally {
            dispatch(setLoading(false));
         }
      };

      checkAuth();
   }, [dispatch]);

   return loading;
};

export default useAuth;
