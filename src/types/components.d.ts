declare module '@/components/EditUserRoleModal' {
  interface EditUserRoleModalProps {
    userId: string;
    userName: string;
    currentRole: string;
    availableRoles: string[];
  }
  
  const EditUserRoleModal: React.FC<EditUserRoleModalProps>;
  export default EditUserRoleModal;
}

declare module '@/components/RoleSettingsForm' {
  interface RoleSettingsFormProps {
    initialRoles: string[];
  }
  
  const RoleSettingsForm: React.FC<RoleSettingsFormProps>;
  export default RoleSettingsForm;
}

declare module './InitializeSettingsButton' {
  const InitializeSettingsButton: React.FC;
  export default InitializeSettingsButton;
} 