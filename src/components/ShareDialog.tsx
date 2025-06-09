'use client';
import { showSuccessToast } from '@/components/CustomToast';
import { Button } from '@/components/ui/button';
import { DialogContent, DialogTitle, Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { FileMetadata } from '@/types/types';
import { Avatar, AvatarFallback } from '@radix-ui/react-avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@radix-ui/react-dropdown-menu';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import React, { useEffect, useRef, useState } from 'react';

const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const fetchAddedUsers = async (docId: string, accessToken: string): Promise<UserTagData[]> => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/documents/${docId}/members`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch added users');
    }
    const data = await response.json();
    console.log('Fetched added users:', data.data);

    return data.data.map(
      (user: { email: string; fullName: string; role: 'owner' | 'edit' | 'view'; id: string }) => ({
        email: user.email,
        name: user.fullName || 'Unregistered User',
        role: user.role,
        id: user.id,
      })
    );
  } catch (error) {
    console.error('Error fetching added users:', error);
    return [];
  }
};

const fetchUserByEmail = async (
  email: string,
  accessToken: string | null,
  ownerEmail: string | undefined
): Promise<UserTagData | null> => {
  if (!accessToken || ownerEmail === email) return null;
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${email}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch user by email');
    }
    const data = await response.json();
    console.log('Fetched user by email:', data);
    if (!data.data)
      return {
        email,
        name: 'Unregistered User',
        role: 'viewer',
        id: '', // No ID for unregistered users
      };

    const user = data.data;
    return {
      email: user.email,
      name: user.fullName || 'Unregistered User',
      role: 'viewer', // Default role, can be changed later
      id: user.id,
    };
  } catch (error) {
    console.error('Error fetching user by email:', error);
    return null;
  }
};

interface ShareDialogProps {
  docData: FileMetadata | null;
  isOpen: boolean;
  accessToken: string | undefined | null;
  handleClose: () => void;
}
const ShareDialog = ({ docData, isOpen, accessToken, handleClose }: ShareDialogProps) => {
  const [draftList, setDraftList] = useState<UserTagData[]>([]);
  const [addedList, setAddedList] = useState<UserTagData[]>([]);
  const initAddedList = useRef<UserTagData[]>([]);

  const [foundUser, setFoundUser] = useState<UserTagData | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isDraftListEmpty, setIsDraftListEmpty] = useState(true);
  const [role, setRole] = useState<'editor' | 'viewer'>('viewer');
  const inputRef = React.useRef<HTMLInputElement>(null);

  const t = useTranslations('shareDialog');

  const handleInputChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    accessToken: string | undefined | null
  ) => {
    if (!accessToken) return;
    if (isValidEmail(e.target.value)) {
      setIsAdding(true);

      // call API to check if email exists in the system
      try {
        const user = await fetchUserByEmail(e.target.value, accessToken, addedList[0]?.email);
        if (!user) {
          // setIsAdding(false);
          return;
        }
        setFoundUser(user);
      } catch (error) {
        console.error('Error fetching user by email:', error);
        return;
      }
    } else {
      setIsAdding(false);
      setFoundUser(null);
    }
  };

  const handleAddedListRoleChange = (email: string, newRole: 'editor' | 'viewer' | 'Remove') => {
    setAddedList((prev) =>
      prev.map((user) => (user.email === email ? { ...user, role: newRole } : user))
    );
  };

  useEffect(() => {
    const fetchInitialUsers = async () => {
      if (!docData?.id || !accessToken) return;
      try {
        const users = await fetchAddedUsers(docData.id, accessToken);
        console.log('Initial added users:', users);
        setAddedList(users);
        initAddedList.current = users;
      } catch (error) {
        console.error('Error fetching initial added users:', error);
      }
    };

    fetchInitialUsers();
  }, [docData, accessToken]);

  useEffect(() => {
    if (draftList.length === 0) {
      setIsDraftListEmpty(true);
    } else {
      setIsDraftListEmpty(false);
    }
  }, [draftList]);

  useEffect(() => {
    if (role === 'editor') {
      setDraftList((prev) => prev.map((user) => ({ ...user, role: 'editor' })));
    } else {
      setDraftList((prev) => prev.map((user) => ({ ...user, role: 'viewer' })));
    }
  }, [role]);

  const handleSaveForAddedList = async (
    docId: string | undefined,
    addedList: UserTagData[],
    accessToken: string | null | undefined
  ) => {
    if (!accessToken || !docId) return;
    const usersToUpdate = addedList.filter((u) => u.role !== 'owner' && u.role !== 'Remove');
    const usersToRemove = addedList.filter((u) => u.role === 'Remove');

    for (const user of usersToRemove) {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/documents/${docId}/members/${user.id}`,
          {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!res.ok) {
          throw new Error('Failed to remove user from document');
        }
        // Remove from addedList state
        setAddedList((prev) => prev.filter((u) => u.email !== user.email));
        initAddedList.current = initAddedList.current.filter((u) => u.email !== user.email);
      } catch (error) {
        console.error('Error removing user from document:', error);
      }
    }

    for (const user of usersToUpdate) {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/documents/${docId}/members/${user.id}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              role: user.role,
            }),
          }
        );

        if (!res.ok) {
          throw new Error('Failed to PATCH user');
        }

        // Update the addedList state with the new role
        setAddedList((prev) =>
          prev.map((u) => (u.email === user.email ? { ...u, role: user.role } : u))
        );
        initAddedList.current = initAddedList.current.map((u) =>
          u.email === user.email ? { ...u, role: user.role } : u
        );
      } catch (error) {
        console.error('Error PATCH user:', error);
      }
    }
    // successfully added all users
    console.log('Successfully added users to document:', docId);
    showSuccessToast({
      title: 'Permissions updated successfully',
    });
  };

  const handleSaveForDraftList = async (
    docId: string | undefined,
    draftList: UserTagData[],
    addedList: UserTagData[],
    accessToken: string | null | undefined
  ) => {
    if (!accessToken || !docId) return;
    console.log('ADDED LIST:', addedList);
    for (const user of draftList) {
      if (addedList.some((u) => u.email === user.email)) {
        console.log('User already exists in added list:', user.email);
        // check role
        const existingUser = addedList.find((u) => u.email === user.email);
        if (existingUser) {
          if (existingUser.role !== user.role)
            // Update role if it has changed
            try {
              const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/documents/${docId}/members/${existingUser.id}`,
                {
                  method: 'PATCH',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                  },
                  body: JSON.stringify({ role: user.role }),
                }
              );
              if (!res.ok) {
                throw new Error('Failed to update user role');
              }
              setAddedList((prev) =>
                prev.map((u) => (u.email === user.email ? { ...u, role: user.role } : u))
              );
              initAddedList.current = initAddedList.current.map((u) =>
                u.email === user.email ? { ...u, role: user.role } : u
              );
              continue;
            } catch (error) {
              console.error('Error updating user role:', error);
            }
        }
      } else
        try {
          console.log('Adding user to document:', user.email);
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/documents/${docId}/members`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              userId: user.id,
              role: user.role,
            }),
          });

          if (!res.ok) {
            throw new Error('Failed to add user to document');
          }
          setAddedList((prev) => [...prev, ...draftList]);
        } catch (error) {
          console.error('Error adding user to document:', error);
        }
    }
    // successfully added all users
    console.log('Successfully added users to document:', docId);
    showSuccessToast({
      title: 'Permissions updated successfully',
    });
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent className='w-[640px] min-w-[640px] h-[398px] py-8 flex flex-col gap-6'>
        {/* Header cố định */}
        <div className='px-8 flex flex-col gap-4 h-fit'>
          <DialogTitle className='text-2xl font-semibold'>
            {/* Share &quot;{docData?.name}&quot; */}
            {t('shareDoc', { name: docData!.name })}
          </DialogTitle>
          <div>
            <Input
              placeholder='Add people'
              ref={inputRef}
              onChange={(e) => handleInputChange(e, accessToken)}
            />
          </div>
        </div>

        {/* Scrollable user list, chiếm hết phần còn lại */}
        <div
          className={cn(
            'flex-1 pl-8 pr-8 h-full overflow-y-scroll',
            draftList.length > 0 && !(isAdding && foundUser) && 'flex flex-col gap-2'
          )}
        >
          {/* List added user */}
          {isAdding && foundUser ? (
            <div
              className='w-full'
              onClick={() => {
                setDraftList((prev) => {
                  if (prev.some((u) => u.email === foundUser.email)) {
                    return prev; // User already exists in draft list
                  }
                  return [...prev, foundUser];
                });
                setFoundUser(null);
                setIsAdding(false);
                if (inputRef.current) inputRef.current.value = '';
              }}
            >
              <UserTag
                email={foundUser.email}
                name={foundUser.name}
                role={foundUser.role}
                id={foundUser.id}
                forFoundedUser={true}
              />
            </div>
          ) : draftList.length > 0 ? (
            draftList.map((user) => (
              <Chip
                key={user.email}
                email={user.email}
                handleRemove={(email) => {
                  setDraftList((prev) => prev.filter((u) => u.email !== email));
                }}
              />
            ))
          ) : (
            <div className='w-full flex flex-col gap-6'>
              {addedList.map((user) => (
                <UserTag
                  key={user.email}
                  email={user.email}
                  name={user.name}
                  role={user.role}
                  id={user.id}
                  forAddedList={true}
                  handleRoleChange={handleAddedListRoleChange}
                />
              ))}
            </div>
          )}
        </div>

        <div
          className={cn(
            'flex items-center justify-end gap-4 mt-4 px-8',
            !isDraftListEmpty && 'justify-between'
          )}
        >
          {!isDraftListEmpty && (
            <div className='text-xs text-[#1E1E1E] flex items-center'>
              <span className='mr-[6px]'>{t('invitedTitle')}</span>
              <RoleDropdownMenu role={role} setRoleForAdded={setRole} forAddNew={true} />
            </div>
          )}

          <div>
            <Button
              className='bg-[#E3E3E3] px-[13.5px] py-3 text-[#1E1E1E] mr-4 hover:bg-[#D9D9D9]'
              onClick={() => {
                handleClose();
                // Reset all states
                setAddedList(initAddedList.current);
                setDraftList([]);
                setIsAdding(false);
                setFoundUser(null);
                setRole('viewer');
                setIsDraftListEmpty(true);
              }}
            >
              {t('cancel')}
            </Button>
            <Button
              className='bg-[#2C2C2C] px-[13.5px] py-3 text-[#F5F5F5]'
              disabled={
                draftList.length === 0 &&
                addedList.length === initAddedList.current.length &&
                addedList.every(
                  (u, i) =>
                    u.email === initAddedList.current[i]?.email &&
                    u.role === initAddedList.current[i]?.role
                )
              }
              onClick={() => {
                if (draftList.length === 0)
                  handleSaveForAddedList(docData?.id, addedList, accessToken);
                else {
                  handleSaveForDraftList(docData?.id, draftList, addedList, accessToken);
                }
                setDraftList([]);
                setIsAdding(false);
                setFoundUser(null);
                setRole('viewer');
                setIsDraftListEmpty(true);
                handleClose();
              }}
            >
              {draftList.length === 0 ? t('save') : t('add')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Chip = ({
  email,
  handleRemove,
}: {
  email: string;
  handleRemove: (email: string) => void;
}) => {
  return (
    <div className='border-[1px] border-[#757575] px-3 py-1 rounded-full w-fit h-fit text-[#1E1E1E]'>
      {email}
      <X
        className='inline-block ml-2 cursor-pointer'
        onClick={() => {
          // Handle chip removal logic here
          handleRemove(email);
        }}
      />
    </div>
  );
};

interface UserTagData {
  email: string;
  name: string;
  role: 'owner' | 'editor' | 'viewer' | 'Remove';
  id: string;
  forAddedList?: boolean;
  handleRoleChange?: (email: string, newRole: 'editor' | 'viewer' | 'Remove') => void;
  forFoundedUser?: boolean;
}

const UserTag = ({
  name,
  role,
  email,
  forAddedList,
  handleRoleChange,
  forFoundedUser,
}: UserTagData) => {
  const t = useTranslations('shareDialog');
  const tDoc = useTranslations('documents');
  return (
    <div
      className={cn(
        'w-full flex pr-2',
        forFoundedUser && 'border-[1px] border-[#D9D9D9] rounded-lg p-3 shadow-md'
      )}
    >
      <div className='w-[40px] h-[40px] mr-3'>
        <Avatar
          className={cn(
            'w-full h-full rounded-full bg-[#F5C731] flex items-center justify-center',
            name === 'Unregistered User' ? 'bg-[#900B09]/60' : 'bg-[#F5C731]'
          )}
        >
          <AvatarFallback className='text-xs font-medium text-gray-900'>
            {name !== 'Unregistered User' ? name.split(' ').map((n) => n[0]) : 'U'}
          </AvatarFallback>
        </Avatar>
      </div>
      <div className='flex-1'>
        {name !== 'Unregistered User' ? (
          <p className='font-semibold'>
            {name} {role === 'owner' && `(${tDoc('you')})`}
          </p>
        ) : (
          <p className='font-semibold text-[#900B09]'>{t('unregistedUser')}</p>
        )}

        <p className='text-[#757575]'>{email}</p>
      </div>
      {forAddedList === true && role !== 'owner' ? (
        <div className='flex items-center'>
          <RoleDropdownMenu role={role} setRole={handleRoleChange!} email={email} />
        </div>
      ) : (
        <div className='text-[#757575] italic flex items-center'>
          {role === 'owner' ? t('ownerRole') : ''}
        </div>
      )}
    </div>
  );
};

const RoleDropdownMenu = ({
  role,
  setRole,
  email,
  forAddNew = false,
  setRoleForAdded,
}: {
  email?: string;
  role: 'editor' | 'viewer' | 'Remove';
  setRole?: (email: string, value: 'editor' | 'viewer' | 'Remove') => void;
  setRoleForAdded?: (value: 'editor' | 'viewer') => void;
  forAddNew?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations('shareDialog');
  return (
    <DropdownMenu onOpenChange={(open) => setIsOpen(open)}>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'text-xs text-[#1E1E1E] p-1 font-semibold rounded-md h-fit',
            isOpen
              ? 'border-[#FFCF33] border-[1px] bg-[#F5F5F5]'
              : 'border-[1px] border-transparent'
          )}
        >
          {role === 'editor' ? t('editRole') : role === 'viewer' ? t('viewRole') : t('removeRole')}
          <Image
            src='/icons/dropdown-trigger.svg'
            alt='chevron down'
            width={16}
            height={16}
            className='inline-block ml-1'
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className='w-[185px] rounded-lg bg-white shadow-lg border-[#D9D9D9] border-[1px]'
        side='top'
        align='start'
        sideOffset={10}
      >
        <DropdownMenuRadioGroup
          value={role}
          onValueChange={(value) => {
            if (forAddNew) {
              setRoleForAdded?.(value as 'editor' | 'viewer');
            } else {
              setRole?.(email!, value as 'editor' | 'viewer' | 'Remove');
            }
          }}
          className='text-[#1E1E1E] w-[185px] p-2'
        >
          <DropdownMenuRadioItem
            value='editor'
            className={cn('w-full py-3 px-4 rounded-md', role === 'editor' && 'bg-[#D9D9D9]')}
          >
            {t('editRole')}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem
            value='viewer'
            className={cn('w-full py-3 px-4 rounded-md', role === 'viewer' && 'bg-[#D9D9D9]')}
          >
            {t('viewRole')}
          </DropdownMenuRadioItem>
          {!forAddNew && (
            <DropdownMenuRadioItem
              value='Remove'
              className={cn('w-full py-3 px-4 rounded-md', role === 'Remove' && 'bg-[#D9D9D9]')}
            >
              {t('removeRole')}
            </DropdownMenuRadioItem>
          )}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ShareDialog;
