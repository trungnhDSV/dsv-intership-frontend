'use client';
import { Button } from '@/components/ui/button';
import { DialogContent, DialogTitle, Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { FileMetadata } from '@/types/types';
import { Avatar, AvatarFallback } from '@radix-ui/react-avatar';
import React, { useEffect } from 'react';

const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const fetchAddedUsers = async (docId: string): Promise<UserTagData[]> => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/documents/${docId}/members`);
    if (!response.ok) {
      throw new Error('Failed to fetch added users');
    }
    const data = await response.json();
    console.log('Fetched added users:', data.data);

    return data.data.map(
      (user: { email: string; fullName: string; role: 'owner' | 'edit' | 'view' }) => ({
        email: user.email,
        name: user.fullName || 'Unregistered User',
        role: user.role,
      })
    );
  } catch (error) {
    console.error('Error fetching added users:', error);
    return [];
  }
};

const fetchUserByEmail = async (email: string): Promise<UserTagData | null> => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${email}`);
    if (!response.ok) {
      throw new Error('Failed to fetch user by email');
    }
    const data = await response.json();
    if (data.data.length === 0) return null;

    const user = data.data[0];
    return {
      email: user.email,
      name: user.fullName || 'Unregistered User',
      role: 'view', // Default role, can be changed later
    };
  } catch (error) {
    console.error('Error fetching user by email:', error);
    return null;
  }
};

interface ShareDialogProps {
  docData: FileMetadata | null;
  isOpen: boolean;
}
const ShareDialog = ({ docData, isOpen }: ShareDialogProps) => {
  const [draftList, setDraftList] = React.useState<UserTagData[]>([]);
  const [addedList, setAddedList] = React.useState<UserTagData[]>([
    {
      email: 'text@gmail.com',
      name: 'John Doe',
      role: 'owner',
    },
    {
      email: 'alice@example.com',
      name: 'Alice Smith',
      role: 'edit',
    },
    {
      email: 'bob@example.com',
      name: 'Bob Johnson',
      role: 'view',
    },
    {
      email: 'carol@example.com',
      name: 'Carol Lee',
      role: 'edit',
    },
    {
      email: 'dave@example.com',
      name: 'Dave Brown',
      role: 'view',
    },
  ]);
  const [isAdding, setIsAdding] = React.useState(false);

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isValidEmail(e.target.value)) {
      setIsAdding(true);

      // call API to check if email exists in the system

      // const newDraft: UserTagData = {
      //   email: e.target.value,
      //   role: 'view', // Default role, can be changed later
      // };
      // setDraftList((prev) => [...prev, newDraft]);
      // setInputValue(''); // Clear input after adding to draft
    }
  };

  useEffect(() => {
    const fetchInitialUsers = async () => {
      if (!docData?.id) return;
      try {
        const users = await fetchAddedUsers(docData.id);
        console.log('Initial added users:', users);
        setAddedList(users);
      } catch (error) {
        console.error('Error fetching initial added users:', error);
      }
    };

    fetchInitialUsers();
  }, [docData]);

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className='w-[640px] min-w-[640px] h-[398px] py-8'>
        {/* Header cố định */}
        <div className='px-8 flex flex-col gap-4'>
          <DialogTitle className='text-2xl font-semibold'>
            Share &quot;{docData?.name}&quot;
          </DialogTitle>
          <div>
            <Input placeholder='Add people' onChange={handleInputChange} />
          </div>
        </div>

        {/* Scrollable user list, chiếm hết phần còn lại */}
        <div className='flex-1 overflow-y-auto space-y-6 mt-6 pl-8 pr-6'>
          {/* List added user */}
          {draftList.length > 0 ? (
            <></>
          ) : isAdding ? (
            <></>
          ) : (
            addedList.map((user) => (
              <UserTag key={user.email} email={user.email} name={user.name} role={user.role} />
            ))
          )}

          {/* Hiển thị thông báo nếu không có người dùng nào */}
        </div>

        {/* Action buttons luôn nằm dưới cùng */}
        <div className='flex items-center justify-end gap-4 mt-4 px-8'>
          <Button className='bg-[#E3E3E3] px-[13.5px] py-3 text-[#1E1E1E]'>Cancel</Button>
          <Button className='bg-[#2C2C2C] px-[13.5px] py-3 text-[#F5F5F5]'>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface UserTagData {
  email: string;
  name: string;
  role: 'owner' | 'edit' | 'view';
}

const UserTag = ({ name, role, email }: UserTagData) => {
  return (
    <div className='w-full flex pr-2'>
      <div className='w-[40px] h-[40px] mr-3'>
        <Avatar className='w-full h-full rounded-full bg-[#F5C731] flex items-center justify-center'>
          <AvatarFallback className='text-xs font-medium text-gray-900'>
            {name ? name.split(' ').map((n) => n[0]) : 'U'}
          </AvatarFallback>
        </Avatar>
      </div>
      <div className='flex-1'>
        {name ? (
          <p className='font-semibold'>
            {name} {role === 'owner' && '(You)'}
          </p>
        ) : (
          <p className='font-semibold text-[#900B09]'>Unregistered User</p>
        )}

        <p className='text-[#757575]'>{email}</p>
      </div>
      <div className='text-[#757575] italic flex items-center'>{role}</div>
    </div>
  );
};

export default ShareDialog;
