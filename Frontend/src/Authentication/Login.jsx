import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function Login({ setUser }) {
  const [form, setForm] = useState({
    email: "",
    password: ""
  });
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        const res = await axios.post("http://localhost:5000/api/auth/login", form, {
          withCredentials: true // Crucial for receiving the secure HTTP-only cookie
        });
        
        const loggedUser = res.data.user;
        setUser(loggedUser);
        
        if (loggedUser.role === 'admin') {
           navigate("/admin-dashboard"); 
        } else {
           // Route regular contributors straight to the map to start earning points!
           navigate("/map"); 
        }
    } catch(err) {
        alert("Invalid login details");
        console.error("Login Error:", err);
    }
  };
  
  return (
    <div className="flex min-h-screen flex-col justify-center px-6 py-12 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
    
        <Link to="/" className="flex justify-center -m-1.5 p-1.5">
          <div className="bg-[#1D4A79] px-3 py-1 rounded shadow-sm">
            <span className="text-2xl font-extrabold tracking-tight text-white">Indawo</span>
          </div>
        </Link>
        <h2 className="mt-10 text-center text-2xl font-bold tracking-tight text-[#1D4A79]">
          Sign in to your account
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm bg-white p-8 shadow-sm rounded-xl border border-gray-100">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-bold text-[#1D4A79]">
              Email address
            </label>
            <div className="mt-2">
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#FDBA31] sm:text-sm"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-bold text-[#1D4A79]">
                Password
              </label>
              <div className="text-sm">
                <a href="#" className="font-semibold text-[#1D4A79] hover:text-[#FDBA31] transition-colors">
                  Forgot password?
                </a>
              </div>
            </div>
            <div className="mt-2">
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#FDBA31] sm:text-sm"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="flex w-full justify-center rounded-md bg-[#FDBA31] px-3 py-2 text-sm font-bold text-[#1D4A79] shadow-sm hover:bg-yellow-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FDBA31] transition-transform hover:scale-105"
            >
              Sign in
            </button>
          </div>
        </form>

        <p className="mt-10 text-center text-sm text-gray-500">
          Don't have an account yet?{' '}
          <Link to="/register" className="font-bold text-[#1D4A79] hover:text-[#FDBA31] transition-colors">
            Sign up for free
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;