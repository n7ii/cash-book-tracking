import axios from 'axios';

import { api } from './api';

interface LoginResponse {
    message: string;
    token: string;
    user:{
        uid: number;
        fname: string;
        lname: string;
        username: string;
        roleId: number;
      };
}

export const loginUser = async (username: string, password: string): Promise<LoginResponse> => {
    try{
        const response = await api.post<LoginResponse>(`/users/login`, {
            username: username,
            password: password,
        });

        return response.data;

    }catch(error){
        if(axios.isAxiosError(error) && error.response){
            throw new Error(error.response.data);
        }
        throw new Error('An unexpected error occurred during login')
    }
}