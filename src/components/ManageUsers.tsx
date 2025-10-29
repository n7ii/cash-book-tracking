import React, { useState, useEffect, useRef } from 'react';
import { Edit2, Trash, UserPlus, XCircle, ChevronsLeft, ChevronsRight, Search, Eye, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNotifications } from '../contexts/NotificationContext';
import { 
    ApiUser, 
    NewUserData,
    fetchAllUsers, 
    registerUser, 
    updateUser, 
    setUserStatus,
    searchAddresses,
    AddressSearchResult,
    UserApiResponse,
    resetUserPassword
} from './Service/adminService';

const ManageUsers: React.FC = () => {
    // --- Refs for input focusing ---
    const fnameInputRef = useRef<HTMLInputElement>(null);
    const lnameInputRef = useRef<HTMLInputElement>(null);
    const usernameInputRef = useRef<HTMLInputElement>(null);
    const phoneInputRef = useRef<HTMLInputElement>(null);
    const emailInputRef = useRef<HTMLInputElement>(null);

    // --- All state variables remain the same ---
    const [users, setUsers] = useState<ApiUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const limit = 15;
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState<Partial<NewUserData>>({ role_id: 4 });
    const [showPwd, setShowPwd] = useState(false);
    const [addressSearch, setAddressSearch] = useState({ village: '', district: '', province: '' });
    const [addressResults, setAddressResults] = useState<AddressSearchResult[]>([]);
    const [selectedAddress, setSelectedAddress] = useState<AddressSearchResult | null>(null);
    const { showConfirm } = useNotifications();

    // --- Data fetching and other functions remain the same ---
    const loadUsers = async () => {
        setIsLoading(true);
        try {
            const response: UserApiResponse = await fetchAllUsers(currentPage, limit, debouncedSearchTerm);
            setUsers(response.data);
            setTotalUsers(response.total);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch users.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    useEffect(() => {
        loadUsers();
    }, [currentPage, debouncedSearchTerm]);
    
    useEffect(() => {
        const handler = setTimeout(async () => {
            const { village, district, province } = addressSearch;
            if (village.length > 1 || district.length > 1 || province.length > 1) {
                    try {
                        const results = await searchAddresses(addressSearch);
                        setAddressResults(results);
                    } catch (error) { console.error("Failed to search addresses:", error); }
            } else {
                setAddressResults([]);
            }
        }, 500);
        return () => clearTimeout(handler);
    }, [addressSearch]);

    function resetForm() {
        setForm({ role_id: 4 });
        setEditingId(null);
        setShowPwd(false);
        setSelectedAddress(null);
        setAddressSearch({ village: '', district: '', province: '' });
        setIsFormVisible(false);
    }
  
    // --- UPDATED handleSubmit with CONSISTENT validation ---
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        // --- Validation Block with focusing for ALL required fields ---
        if (!form.Fname || form.Fname.trim() === '') {
            toast.error('First name is required.');
            fnameInputRef.current?.focus();
            return;
        }
        if (!form.Lname || form.Lname.trim() === '') {
            toast.error('Last name is required.');
            lnameInputRef.current?.focus();
            return;
        }
        if (!form.username || form.username.trim() === '') {
            toast.error('Username is required.');
            usernameInputRef.current?.focus();
            return;
        }
        if (!form.phone || form.phone.trim() === '') {
            toast.error('Phone number is required.');
            phoneInputRef.current?.focus();
            return;
        }
        if (!form.Email || form.Email.trim() === '') {
            toast.error('Email is required.');
            emailInputRef.current?.focus();
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(form.Email)) {
            toast.error('Please enter a valid email format.');
            emailInputRef.current?.focus();
            return;
        }
        if (!selectedAddress) {
            toast.error('You must search for and select an address.');
            return;
        }
        if (!editingId && (!form.password || form.password.length < 6)) {
            toast.error('Password must be at least 6 characters for new users.');
            return;
        }
        if (editingId && form.password && form.password.length > 0 && form.password.length < 6) {
            toast.error("New password must be at least 6 characters.");
            return;
        }

        // --- Payload creation and API call logic remains the same ---
        const payload: NewUserData = {
            Fname: form.Fname.trim(), Lname: form.Lname.trim(), username: form.username.trim(),
            phone: form.phone.trim(), Email: form.Email.trim(),
            address: selectedAddress.id.toString(), role_id: Number(form.role_id),
        };

        const actionPromises = [];

    if (editingId) {
        // Always update user details
        actionPromises.push(updateUser(editingId, payload));

        // If a new password was provided, ALSO add the password reset call
        if (form.password && form.password.length >= 6) {
            actionPromises.push(resetUserPassword(editingId, form.password));
        }
    } else {
        // For new users, add password directly
        payload.password = form.password;
        actionPromises.push(registerUser(payload));
    }

    // --- Show combined toast notification ---
    const combinedPromise = Promise.allSettled(actionPromises)
        .then(async (results) => {
            // Check if any promise failed
            const failed = results.find(r => r.status === 'rejected');
            if (failed) {
                // Extract error message if possible
                throw (failed as PromiseRejectedResult).reason;
            }
            // If all succeed
            resetForm();
            await loadUsers();
            return 'User saved successfully!'; // Success message

        });

        toast.promise(combinedPromise, {
            loading: 'Saving user...',
            success: (message) => String(message),
            error: (err) => err.message || 'Failed to save user.',
        });
    }

    // --- All other handler functions remain the same ---
    function handleEdit(user: ApiUser) {
        setEditingId(user.UID);
        setForm({
            Fname: user.Fname, Lname: user.Lname, role_id: user.role_id,
            phone: user.phone, Email: user.Email, username: user.username,
            address: user.address_id ? user.address_id.toString() : null,
            password: '',
        });
        if (user.address_id && user.address_name) {
            setSelectedAddress({ id: user.address_id, name: user.address_name });
            const parts = user.address_name.split(', ');
            setAddressSearch({ village: parts[0] || '', district: parts[1] || '', province: '' });
        } else {
            setSelectedAddress(null);
            setAddressSearch({ village: '', district: '', province: '' });
        }
        setIsFormVisible(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  
    function handleAddressSelect(result: AddressSearchResult) {
        setSelectedAddress(result);
        const parts = result.name.split(', ');
        setAddressSearch({ village: parts[0] || '', district: parts[1] || '', province: '' });
        setAddressResults([]);
    }

    function handleToggleStatus(user: ApiUser) {
        const action = user.is_active ? 'deactivate' : 'activate';
        const message = `Are you sure you want to ${action} the user ${user.Fname} ${user.Lname}?`;
        
        const onConfirmAction = () => {
            
            const actionPromise = setUserStatus(user.UID, !user.is_active).then(() => loadUsers());
            
            toast.promise(actionPromise, {
                loading: 'Updating status...',
                success: 'User status updated successfully!',
                error: 'Failed to update status.',
            });
        };

        showConfirm(message, onConfirmAction);
    }
    
    function clearAddress() {
        setSelectedAddress(null);
        setAddressSearch({ village: '', district: '', province: '' });
    }

    const getRoleName = (roleId: number): string => {
        const roles: { [key: number]: string } = { 1: 'Admin', 3: 'Collector', 4: 'Employee' };
        return roles[roleId] || 'Unknown';
    };
  
    const totalPages = Math.ceil(totalUsers / limit);

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'Fname' | 'Lname') => {
        const value = e.target.value;
        if (!/\d/.test(value)) {
            setForm({ ...form, [field]: value });
        }
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (/^[\d+]*$/.test(value)) {
            setForm({ ...form, phone: value });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Manage Users</h1>
                    <p className="text-gray-500">Add, edit, and manage system users.</p>
                </div>
                {!isFormVisible && (
                    <button onClick={() => { resetForm(); setIsFormVisible(true); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        <UserPlus className="h-5 w-5" /> Add New User
                    </button>
                )}
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search by name, email, phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg"
                />
            </div>

            {isFormVisible && (
                <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-6 space-y-5" noValidate>
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold">{editingId ? 'Edit User' : 'Create New User'}</h2>
                        <button type="button" onClick={resetForm}><XCircle className="h-6 w-6 text-gray-500 hover:text-red-600" /></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium">First name *</label><input ref={fnameInputRef} className="w-full border rounded-lg p-2" value={form.Fname ?? ''} onChange={(e) => handleNameChange(e, 'Fname')} /></div>
                        <div><label className="block text-sm font-medium">Last name *</label><input ref={lnameInputRef} className="w-full border rounded-lg p-2" value={form.Lname ?? ''} onChange={(e) => handleNameChange(e, 'Lname')} /></div>
                        <div><label className="block text-sm font-medium">Role *</label><select className="w-full border rounded-lg p-2" value={form.role_id} onChange={(e) => setForm({ ...form, role_id: Number(e.target.value) })}><option value={4}>Employee</option><option value={3}>Collector</option></select></div>
                        <div><label className="block text-sm font-medium">Phone *</label><input ref={phoneInputRef} className="w-full border rounded-lg p-2" value={form.phone ?? ''} onChange={handlePhoneChange} placeholder="020..." /></div>
                        <div><label className="block text-sm font-medium">Email *</label><input ref={emailInputRef} type="email" className="w-full border rounded-lg p-2" value={form.Email ?? ''} onChange={(e) => setForm({ ...form, Email: e.target.value })} placeholder="name@example.com" /></div>
                        <div><label className="block text-sm font-medium">Username *</label><input ref={usernameInputRef} className="w-full border rounded-lg p-2" value={form.username ?? ''} onChange={(e) => setForm({ ...form, username: e.target.value })} /></div>
                        <div><label className="block text-sm font-medium">{editingId ? 'New Password (optional)' : 'Password *'}</label><div className="relative"><input type={showPwd ? 'text' : 'password'} className="w-full border rounded-lg p-2 pr-10" value={form.password ?? ''} onChange={(e) => setForm({ ...form, password: e.target.value })} /><button type="button" onClick={() => setShowPwd(s => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500"><Eye className="h-4 w-4" /></button></div></div>
                        <div className="md:col-span-2 space-y-2">{selectedAddress?(<div><label className="block text-sm font-medium">Selected Address *</label><div className="flex items-center justify-between p-2 border rounded-lg bg-gray-50"><span>{selectedAddress.name}</span><button type="button" onClick={clearAddress} className="text-sm text-red-600">Clear</button></div></div>):(<div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative"><div><label className="block text-sm font-medium">Village</label><input className="w-full border rounded-lg p-2" value={addressSearch.village} onChange={(e) => setAddressSearch({ ...addressSearch, village: e.target.value })} placeholder="Search village..."/></div><div><label className="block text-sm font-medium">District</label><input className="w-full border rounded-lg p-2" value={addressSearch.district} onChange={(e) => setAddressSearch({ ...addressSearch, district: e.target.value })} placeholder="Search district..."/></div><div><label className="block text-sm font-medium">Province</label><input className="w-full border rounded-lg p-2" value={addressSearch.province} onChange={(e) => setAddressSearch({ ...addressSearch, province: e.target.value })} placeholder="Search province..."/></div>{addressResults.length > 0 && (<ul className="absolute top-full mt-2 w-full bg-white border rounded-lg shadow-lg z-10 md:col-span-3">{addressResults.map((r) => (<li key={r.id} onClick={() => handleAddressSelect(r)} className="p-3 hover:bg-blue-50 cursor-pointer border-b">{r.name}</li>))}</ul>)}</div>)}</div>
                    </div>
                    <div className="flex justify-end gap-2"><button type="submit" className="px-4 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700">{editingId ? 'Save Changes' : 'Add User'}</button></div>
                </form>
            )}

            <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="border-b"><tr><th className="px-3 py-2">Name</th><th className="px-3 py-2">Role</th><th className="px-3 py-2">Username</th><th className="px-3 py-2">Contact</th><th className="px-3 py-2">Actions</th></tr></thead>
                    <tbody>
                        {isLoading && (<tr><td colSpan={5} className="p-6 text-center text-gray-500"><Loader2 className="animate-spin" /></td></tr>)}
                        {!isLoading && users.map((u) => (<tr key={u.UID} className="border-b hover:bg-gray-50"><td className="px-3 py-2">{u.Fname} {u.Lname}</td><td className="px-3 py-2">{getRoleName(u.role_id)}</td><td className="px-3 py-2">{u.username}</td><td className="px-3 py-2"><div>{u.Email || '-'}</div><div className="text-xs text-gray-500">{u.phone || '-'}</div></td><td className="px-3 py-2"><div className="flex gap-2"><button onClick={() => handleEdit(u)} className="p-1 text-gray-600 hover:text-blue-600" title="Edit User"><Edit2 className="h-4 w-4" /></button><button onClick={() => handleToggleStatus(u)} className={`p-1 ${u.is_active ? 'text-red-600' : 'text-green-600'}`} title={u.is_active ? 'Deactivate User' : 'Activate User'}>{u.is_active ? <Trash className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}</button></div></td></tr>))}
                        {users.length === 0 && !isLoading && (<tr><td colSpan={5} className="p-6 text-center text-gray-500">No users found.</td></tr>)}
                    </tbody>
                </table>
            </div>

            {totalUsers > limit && (
                <div className="flex justify-between items-center text-sm">
                    <span>Showing {users.length > 0 ? ((currentPage - 1) * limit) + 1 : 0} - {Math.min(currentPage * limit, totalUsers)} of {totalUsers} users</span>
                    <div className="flex gap-2 items-center">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 border rounded-lg disabled:opacity-50"><ChevronsLeft className="h-4 w-4" /></button>
                    <span>Page {currentPage} of {totalPages}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} className="p-2 border rounded-lg disabled:opacity-50"><ChevronsRight className="h-4 w-4" /></button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageUsers;