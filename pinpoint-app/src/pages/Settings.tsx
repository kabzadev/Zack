import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Card, Button, Input, Badge } from '../components';
import { useAuthStore } from '../stores/authStore';
import {
  User,
  Building2,
  LogOut,
  Shield,
  ChevronRight,
  Info,
  Phone,
  MapPin,
  Save,
  Check,
} from 'lucide-react';

export const Settings = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  /* Profile form */
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone] = useState(user?.phoneNumber || '');
  const [profileSaved, setProfileSaved] = useState(false);

  /* Company form */
  const [companyName, setCompanyName] = useState(
    () => localStorage.getItem('pp_company_name') || 'Pinpoint Painting'
  );
  const [companyAddress, setCompanyAddress] = useState(
    () => localStorage.getItem('pp_company_address') || ''
  );
  const [companySaved, setCompanySaved] = useState(false);

  const handleSaveProfile = () => {
    // In a real app this would call the API — for now persist locally
    localStorage.setItem('pp_user_name', profileName);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  };

  const handleSaveCompany = () => {
    localStorage.setItem('pp_company_name', companyName);
    localStorage.setItem('pp_company_address', companyAddress);
    setCompanySaved(true);
    setTimeout(() => setCompanySaved(false), 2000);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Layout activeTab="settings">
      <div className="px-5 pt-6 pb-8 space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-slate-400 text-sm mt-1">Manage your account and preferences</p>
        </div>

        {/* User Profile */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <User size={20} className="text-blue-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Profile</h2>
              <p className="text-xs text-slate-500">Your personal information</p>
            </div>
            <Badge variant={user?.role === 'admin' ? 'info' : 'neutral'} size="sm">
              {user?.role || 'user'}
            </Badge>
          </div>

          <div className="space-y-3">
            <Input
              label="Name"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="Your name"
              leftIcon={<User size={16} />}
            />
            <Input
              label="Phone"
              value={profilePhone}
              disabled
              leftIcon={<Phone size={16} />}
            />

            <Button
              size="sm"
              icon={profileSaved ? <Check size={16} /> : <Save size={16} />}
              onClick={handleSaveProfile}
              variant={profileSaved ? 'secondary' : 'primary'}
            >
              {profileSaved ? 'Saved!' : 'Save Profile'}
            </Button>
          </div>
        </Card>

        {/* Company Info */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-cyan-500/20 rounded-xl flex items-center justify-center">
              <Building2 size={20} className="text-cyan-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Company</h2>
              <p className="text-xs text-slate-500">Business details for estimates</p>
            </div>
          </div>

          <div className="space-y-3">
            <Input
              label="Company Name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Your company name"
              leftIcon={<Building2 size={16} />}
            />
            <Input
              label="Address"
              value={companyAddress}
              onChange={(e) => setCompanyAddress(e.target.value)}
              placeholder="123 Main St, City, ST 00000"
              leftIcon={<MapPin size={16} />}
            />

            <Button
              size="sm"
              icon={companySaved ? <Check size={16} /> : <Save size={16} />}
              onClick={handleSaveCompany}
              variant={companySaved ? 'secondary' : 'primary'}
            >
              {companySaved ? 'Saved!' : 'Save Company Info'}
            </Button>
          </div>
        </Card>

        {/* Admin Panel Link */}
        {user?.role === 'admin' && (
          <Card
            clickable
            onClick={() => navigate('/admin')}
            className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Shield size={20} className="text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-white">Admin Panel</p>
                <p className="text-xs text-slate-400">Manage users, approvals, and roles</p>
              </div>
              <ChevronRight size={18} className="text-slate-500" />
            </div>
          </Card>
        )}

        {/* Theme Toggle (Future) */}
        <Card className="opacity-60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-700/50 rounded-xl flex items-center justify-center">
                <span className="text-lg">🎨</span>
              </div>
              <div>
                <p className="font-medium text-white text-sm">Theme</p>
                <p className="text-xs text-slate-500">Dark mode (coming soon)</p>
              </div>
            </div>
            <div className="w-12 h-7 bg-slate-700 rounded-full relative">
              <div className="absolute right-1 top-1 w-5 h-5 bg-blue-500 rounded-full" />
            </div>
          </div>
        </Card>

        {/* Sign Out */}
        <Button variant="danger" fullWidth icon={<LogOut size={18} />} onClick={handleLogout}>
          Sign Out
        </Button>

        {/* Version Info */}
        <div className="text-center pt-4">
          <div className="flex items-center justify-center gap-2 text-slate-600 text-xs">
            <Info size={12} />
            <span>Pinpoint Painting v1.0.0</span>
          </div>
          <p className="text-slate-700 text-[10px] mt-1">Built with ♦ in Cleveland, OH</p>
        </div>
      </div>
    </Layout>
  );
};
