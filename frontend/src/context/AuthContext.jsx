import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getCookie = (name) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
      return null;
    };
  
    const checkUserSession = async () => {
      const token = getCookie('access_token');
      const name = getCookie('name');
      const email = getCookie('email');
      const userType = getCookie('user_type');
  
      if (name && token && email && userType) {
        setUser({ access_token: token, name, email, user_type: userType });
        setLoading(false);
        return;
      }
  
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/user/me`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${user.access_token}`,
          },
        });
        const data = await response.json();
        if (response.ok && data.success) {
          setUser(data);
        } else {
          console.log("Authentication failed, but keeping cookies intact");
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        console.log("Error fetching user, but keeping cookies intact");
      } finally {
        setLoading(false);
      }
    };
  
    checkUserSession();
  }, []);

  const login = (userData) => {
    if (userData?.access_token) {
      const expires = new Date(Date.now() + 60 * 60 * 1000).toUTCString();
      document.cookie = `access_token=${userData.access_token}; path=/; expires=${expires}; Secure; SameSite=None;`;
      document.cookie = `name=${userData.name}; path=/; expires=${expires}; Secure; SameSite=None;`;
      document.cookie = `email=${userData.email}; path=/; expires=${expires}; Secure; SameSite=None;`;
      document.cookie = `user_type=${userData.user_type}; path=/; expires=${expires}; Secure; SameSite=None;`;
      
      setUser(userData);
    }
  };

  const logout = () => {
    // document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
    // document.cookie = "email=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
    // document.cookie = "user_type=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading || user ? children : null}
    </AuthContext.Provider>
  );
};