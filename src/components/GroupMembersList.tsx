import React, { useEffect, useState } from 'react';

interface Member {
  id: number;
  name: string;
  is_creator?: boolean;
}

interface GroupMembersListProps {
  members: Member[];
  refreshKey: number;
  creatorLabel: string;
  noMembersText: string;
}

export default function GroupMembersList({
  members,
  refreshKey,
  creatorLabel,
  noMembersText
}: GroupMembersListProps) {
  // State to store unique members
  const [uniqueMembers, setUniqueMembers] = useState<Member[]>([]);
  
  // Extract unique members by ID whenever the members list changes
  useEffect(() => {
    const membersMap = new Map<number, Member>();
    members.forEach((member, index) => {
      if (member.id) {
        membersMap.set(member.id, member);
      } else {
        // For members without id, use a synthetic ID based on index
        // This ensures uniqueness for members that don't have IDs yet
        console.log(`Creating synthetic ID for member without ID: ${member.name}`);
        membersMap.set(-(index + 1), { ...member, id: -(index + 1) });
      }
    });
    setUniqueMembers(Array.from(membersMap.values()));
  }, [members, refreshKey]);
  
  if (uniqueMembers.length === 0) {
    return <div className="text-indigo-400 text-center p-4">{noMembersText}</div>;
  }
  
  return (
    <div className="space-y-2" data-member-list={`list-${refreshKey}`}>
      {uniqueMembers.map((member) => (
        <div 
          key={`member-${member.id}-${refreshKey}`}
          className="flex items-center p-2 rounded bg-indigo-700/20"
          data-member-id={String(member.id)}
        >
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center mr-2">
            <span className="text-white font-medium text-sm member-avatar">
              {member.name?.charAt(0)?.toUpperCase() || '?'}
            </span>
          </div>
          <div className="text-sm">
            <span className="font-medium text-indigo-100 member-name">
              {member.name}
              {member.is_creator && (
                <span className="ml-2 text-xs bg-indigo-600/50 text-indigo-200 px-1.5 py-0.5 rounded-full">
                  {creatorLabel}
                </span>
              )}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
} 