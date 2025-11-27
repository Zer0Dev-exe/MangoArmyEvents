import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Users, UserCheck, UserX, Shield, ShieldOff, 
    Trash2, ArrowLeft, Check, X, Copy, AlertCircle,
    Mic, Pickaxe, MessageCircle, Settings, Crown, Code
} from 'lucide-react';
import { getStaffRequests, approveRequest, rejectRequest, getUsers, updateUserRoles, deleteUser } from '../services/api';
import './AdminPanel.css';

const AVAILABLE_ROLES = [
    { id: 'owner', label: 'Owner', icon: Crown, color: '#eab308', priority: 0 },
    { id: 'admin', label: 'Manager Eventos', icon: Shield, color: '#f97316', priority: 1 },
    { id: 'developer', label: 'Developer', icon: Code, color: '#06b6d4', priority: 2 },
    { id: 'staff-discord', label: 'Staff Discord', icon: MessageCircle, color: '#3b82f6', priority: 3 },
    { id: 'staff-mc', label: 'Staff MC', icon: Pickaxe, color: '#16a34a', priority: 4 },
    { id: 'podcaster', label: 'Podcaster', icon: Mic, color: '#9333ea', priority: 5 }
];

const AdminPanel = ({ user }) => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('requests');
    const [requests, setRequests] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [approvedUser, setApprovedUser] = useState(null);
    const [editingUser, setEditingUser] = useState(null);
    const [editingRoles, setEditingRoles] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [requestsData, usersData] = await Promise.all([
                getStaffRequests(),
                getUsers()
            ]);
            setRequests(requestsData);
            setUsers(usersData);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (requestId) => {
        try {
            const response = await approveRequest(requestId, user.discordId);
            setApprovedUser(response.user);
            fetchData();
        } catch (error) {
            console.error('Error approving request:', error);
        }
    };

    const handleReject = async (requestId) => {
        if (window.confirm('¿Estás seguro de rechazar esta solicitud?')) {
            try {
                await rejectRequest(requestId, user.discordId);
                fetchData();
            } catch (error) {
                console.error('Error rejecting request:', error);
            }
        }
    };

    const startEditingRoles = (u) => {
        setEditingUser(u.discordId);
        // Convertir el rol actual a array de roles
        const currentRoles = Array.isArray(u.roles) ? u.roles : [u.role];
        setEditingRoles(currentRoles);
    };

    const toggleRole = (roleId) => {
        setEditingRoles(prev => {
            if (prev.includes(roleId)) {
                // No permitir quitar todos los roles
                if (prev.length === 1) return prev;
                return prev.filter(r => r !== roleId);
            } else {
                return [...prev, roleId];
            }
        });
    };

    const saveRoles = async () => {
        try {
            await updateUserRoles(editingUser, editingRoles, user.discordId);
            setEditingUser(null);
            setEditingRoles([]);
            fetchData();
        } catch (error) {
            console.error('Error updating roles:', error);
        }
    };

    const cancelEdit = () => {
        setEditingUser(null);
        setEditingRoles([]);
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm('¿Estás seguro de eliminar este usuario?')) {
            try {
                await deleteUser(userId, user.discordId);
                fetchData();
            } catch (error) {
                console.error('Error deleting user:', error);
            }
        }
    };

    const getUserRoles = (u) => {
        // Normalizar roles antiguos a nuevos
        const roleMapping = {
            'staff-podcaster': 'podcaster',
            'staff': 'podcaster'
        };
        
        let roles = Array.isArray(u.roles) && u.roles.length > 0 ? u.roles : [u.role];
        roles = roles.map(r => roleMapping[r] || r).filter(r => AVAILABLE_ROLES.some(ar => ar.id === r));
        
        // Ordenar por prioridad (menor número = mayor prioridad, owner = 0)
        const sortedRoles = [...roles].sort((a, b) => {
            const priorityA = AVAILABLE_ROLES.find(r => r.id === a)?.priority ?? 99;
            const priorityB = AVAILABLE_ROLES.find(r => r.id === b)?.priority ?? 99;
            return priorityA - priorityB;
        });
        
        return sortedRoles;
    };

    const isOwner = (u) => {
        const roles = getUserRoles(u);
        return roles.includes('owner');
    };

    const currentUserIsOwner = () => {
        return user && (getUserRoles(user).includes('owner'));
    };

    const currentUserIsDeveloper = () => {
        return user && (getUserRoles(user).includes('developer'));
    };

    const canEditUser = (u) => {
        // Owners pueden editar a todos
        if (currentUserIsOwner()) return true;
        // Developers pueden editar a todos excepto owners
        if (currentUserIsDeveloper() && !isOwner(u)) return true;
        // Admins pueden editar a todos excepto owners y developers
        if (!isOwner(u) && !getUserRoles(u).includes('developer')) return true;
        return false;
    };

    const isProtectedUser = (u) => {
        // Si el usuario actual es owner, nadie está protegido
        if (currentUserIsOwner()) return false;
        // Si el usuario actual es developer, solo los owners están protegidos
        if (currentUserIsDeveloper()) return isOwner(u);
        // Para admins, los owners y developers están protegidos
        return isOwner(u) || getUserRoles(u).includes('developer');
    };

    const copyPassword = (password) => {
        navigator.clipboard.writeText(password);
    };

    return (
        <div className="admin-container">
            <div className="admin-header">
                <button onClick={() => navigate('/dashboard')} className="back-btn">
                    <ArrowLeft size={18} />
                    Volver al Dashboard
                </button>
                <h1>
                    <Shield size={24} />
                    Panel de Administración
                </h1>
            </div>

            {approvedUser && (
                <div className="password-modal-overlay" onClick={() => setApprovedUser(null)}>
                    <div className="password-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header success">
                            <UserCheck size={24} />
                            <h2>Usuario Aprobado</h2>
                        </div>
                        <div className="modal-body">
                            <p><strong>{approvedUser.username}</strong> ha sido aprobado como staff.</p>
                            <div className="password-display">
                                <label>Contraseña generada:</label>
                                <div className="password-box">
                                    <code>{approvedUser.password}</code>
                                    <button onClick={() => copyPassword(approvedUser.password)} className="copy-btn">
                                        <Copy size={16} />
                                    </button>
                                </div>
                                <p className="warning">
                                    <AlertCircle size={14} />
                                    Esta contraseña solo se muestra una vez. Compártela con el usuario.
                                </p>
                            </div>
                        </div>
                        <button onClick={() => setApprovedUser(null)} className="btn-close-modal">
                            Entendido
                        </button>
                    </div>
                </div>
            )}

            <div className="admin-tabs">
                <button 
                    className={`tab ${activeTab === 'requests' ? 'active' : ''}`}
                    onClick={() => setActiveTab('requests')}
                >
                    <UserCheck size={18} />
                    Solicitudes
                    {requests.length > 0 && <span className="badge">{requests.length}</span>}
                </button>
                <button 
                    className={`tab ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveTab('users')}
                >
                    <Users size={18} />
                    Usuarios
                </button>
            </div>

            <div className="admin-content">
                {loading ? (
                    <div className="loading">Cargando...</div>
                ) : activeTab === 'requests' ? (
                    <div className="requests-list">
                        {requests.length === 0 ? (
                            <div className="empty-state">
                                <UserCheck size={48} />
                                <p>No hay solicitudes pendientes</p>
                            </div>
                        ) : (
                            requests.map(request => (
                                <div key={request.id} className="request-card">
                                    <div className="request-user">
                                        {request.avatarUrl ? (
                                            <img src={request.avatarUrl} alt={request.username} />
                                        ) : (
                                            <div className="avatar-placeholder">?</div>
                                        )}
                                        <div className="user-info">
                                            <strong>{request.username}</strong>
                                            <span className="discord-id">{request.discordId}</span>
                                            <span className={`staff-type-badge ${request.staffType}`}>
                                                {request.staffType === 'podcaster' && '🎙️ Podcaster'}
                                                {request.staffType === 'minecraft' && '⛏️ Staff MC'}
                                                {request.staffType === 'discord' && '💬 Staff Discord'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="request-actions">
                                        <button 
                                            onClick={() => handleApprove(request.id)} 
                                            className="btn-approve"
                                            title="Aprobar"
                                        >
                                            <Check size={18} />
                                        </button>
                                        <button 
                                            onClick={() => handleReject(request.id)} 
                                            className="btn-reject"
                                            title="Rechazar"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="users-list">
                        {users.length === 0 ? (
                            <div className="empty-state">
                                <Users size={48} />
                                <p>No hay usuarios registrados</p>
                            </div>
                        ) : (
                            users.map(u => (
                                <div key={u.discordId} className="user-card">
                                    <div className="user-avatar">
                                        {u.avatarUrl ? (
                                            <img src={u.avatarUrl} alt={u.username} />
                                        ) : (
                                            <div className="avatar-placeholder">?</div>
                                        )}
                                    </div>
                                    <div className="user-details">
                                        <strong>{u.username}</strong>
                                        <span className="discord-id">{u.discordId}</span>
                                    </div>
                                    
                                    {editingUser === u.discordId ? (
                                        <div className="roles-editor">
                                            <div className="roles-checkboxes">
                                                {AVAILABLE_ROLES.map(role => {
                                                    const Icon = role.icon;
                                                    const isChecked = editingRoles.includes(role.id);
                                                    // Solo owners pueden asignar owner o developer
                                                    const isRestricted = (role.id === 'owner' || role.id === 'developer') && !currentUserIsOwner();
                                                    return (
                                                        <label 
                                                            key={role.id} 
                                                            className={`role-checkbox ${isChecked ? 'checked' : ''} ${isRestricted ? 'disabled' : ''}`}
                                                            style={{ '--role-color': role.color }}
                                                            title={isRestricted ? 'Solo los owners pueden asignar este rol' : ''}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                onChange={() => !isRestricted && toggleRole(role.id)}
                                                                disabled={isRestricted}
                                                            />
                                                            <Icon size={14} />
                                                            <span>{role.label}</span>
                                                            {isRestricted && <Lock size={12} />}
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                            <div className="roles-actions">
                                                <button onClick={saveRoles} className="btn-save" title="Guardar">
                                                    <Check size={16} />
                                                </button>
                                                <button onClick={cancelEdit} className="btn-cancel" title="Cancelar">
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="user-roles">
                                                {(() => {
                                                    const roles = getUserRoles(u);
                                                    const primaryRole = AVAILABLE_ROLES.find(r => r.id === roles[0]);
                                                    if (!primaryRole) return null;
                                                    const PrimaryIcon = primaryRole.icon;
                                                    const extraCount = roles.length - 1;
                                                    const extraRoles = roles.slice(1).map(roleId => 
                                                        AVAILABLE_ROLES.find(r => r.id === roleId)
                                                    ).filter(Boolean);
                                                    
                                                    return (
                                                        <>
                                                            <span className={`role-badge ${roles[0]}`}>
                                                                <PrimaryIcon size={12} />
                                                                {primaryRole.label}
                                                            </span>
                                                            {extraCount > 0 && (
                                                                <div className="extra-roles-container">
                                                                    <span className="role-badge extra-roles">
                                                                        +{extraCount}
                                                                    </span>
                                                                    <div className="extra-roles-tooltip">
                                                                        {extraRoles.map(role => {
                                                                            const Icon = role.icon;
                                                                            return (
                                                                                <span key={role.id} className={`role-badge ${role.id}`}>
                                                                                    <Icon size={12} />
                                                                                    {role.label}
                                                                                </span>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                            <div className="user-actions">
                                                {/* Solo mostrar botones si el usuario actual puede editar a este usuario */}
                                                {canEditUser(u) && (
                                                    <>
                                                        <button 
                                                            onClick={() => startEditingRoles(u)}
                                                            className="btn-edit-roles"
                                                            title="Editar roles"
                                                        >
                                                            <Settings size={16} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteUser(u.discordId)}
                                                            className="btn-delete"
                                                            title="Eliminar usuario"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </>
                                                )}
                                                {/* Mostrar candado si el usuario está protegido */}
                                                {isProtectedUser(u) && (
                                                    <span className="protected-user" title="No tienes permisos para modificar a este usuario">
                                                        🔒
                                                    </span>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPanel;
