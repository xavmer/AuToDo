# Group Chat Feature

## Overview
Added group chat functionality to the messaging sidebar, allowing users to create and participate in multi-user conversations alongside existing direct messages.

## Database Schema

### New Models

1. **GroupChat**
   - `id`: String (UUID)
   - `name`: String (required) - Group chat name
   - `description`: String (optional) - Group description
   - `createdById`: String - ID of user who created the group
   - `createdAt`: DateTime
   - `updatedAt`: DateTime
   - Relations: `createdBy`, `members[]`, `messages[]`

2. **GroupChatMember**
   - `id`: String (UUID)
   - `groupChatId`: String
   - `userId`: String
   - `joinedAt`: DateTime
   - Unique constraint: `groupChatId + userId`
   - Relations: `groupChat`, `user`

3. **GroupChatMessage**
   - `id`: String (UUID)
   - `groupChatId`: String
   - `senderId`: String
   - `body`: String (required)
   - `createdAt`: DateTime
   - Relations: `groupChat`, `sender`

## API Endpoints

### GET /api/groupchats
Returns all group chats the current user is a member of.

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Project Team",
    "description": "Team collaboration",
    "memberCount": 5,
    "members": [
      {
        "user": {
          "id": "uuid",
          "name": "John Doe",
          "email": "john@example.com",
          "avatarUrl": "..."
        }
      }
    ],
    "lastMessage": {
      "body": "Hello team",
      "createdAt": "2024-01-01T00:00:00Z",
      "sender": { "name": "John Doe" }
    }
  }
]
```

### POST /api/groupchats
Creates a new group chat.

**Request Body:**
```json
{
  "name": "Project Team",
  "description": "Team collaboration", // optional
  "memberIds": ["uuid1", "uuid2", "uuid3"]
}
```

**Response:** Created group chat object

### GET /api/groupchats/[id]/messages
Returns all messages in a group chat (requires membership).

**Response:**
```json
[
  {
    "id": "uuid",
    "body": "Hello team",
    "senderId": "uuid",
    "groupChatId": "uuid",
    "createdAt": "2024-01-01T00:00:00Z",
    "sender": {
      "id": "uuid",
      "name": "John Doe",
      "avatarUrl": "..."
    }
  }
]
```

### POST /api/groupchats/[id]/messages
Sends a message to a group chat (requires membership).

**Request Body:**
```json
{
  "body": "Hello team"
}
```

**Response:** Created message object

## UI Components

### MessageSidebar
Updated to support both direct messages and group chats with:
- **Tab Interface**: Switch between "Direct" and "Groups" views
- **Group List**: Shows all group chats with member count and last message
- **Group Thread**: Displays messages with sender names
- **Create Group Button**: Opens modal to create new group chat
- **Group Icons**: Purple/blue gradient avatar with Users icon

### NewGroupModal
Modal component for creating group chats:
- Group name input (required)
- Description input (optional)
- Member selection with checkboxes
- Shows user avatars and names
- Validation: requires at least 1 member

## Features

1. **Tab Navigation**
   - "Direct" tab shows 1-on-1 conversations
   - "Groups" tab shows group chats with "New Group" button

2. **Group Chat Creation**
   - Click "New Group" button
   - Enter group name and optional description
   - Select members from all users
   - Creator is automatically added as member

3. **Group Messaging**
   - Click a group to open message thread
   - Messages show sender name (except your own)
   - Real-time updates every 3 seconds
   - Auto-scroll to latest message

4. **Group Chat List**
   - Shows group name and member count
   - Displays last message with sender name
   - Purple/blue gradient icon with Users symbol

5. **Collapsed Sidebar**
   - First 5 DM contacts shown as icons
   - Group icon shown when group chat is selected
   - Click to expand sidebar

## Technical Details

- **Polling Intervals**: 
  - Group/DM list: 10 seconds
  - Messages: 3 seconds when thread is open
- **Message Detection**: Uses current user ID to distinguish own messages
- **Session Management**: Fetches current user from `/api/auth/session`
- **Validation**: Zod schemas for API request validation
- **Security**: Membership verification on all group operations

## Usage Example

1. Log in to the application
2. Open the messages sidebar (left side)
3. Click the "Groups" tab
4. Click "New Group" button
5. Enter group name (e.g., "Project Alpha Team")
6. Select team members from the list
7. Click "Create"
8. Click the newly created group to open chat
9. Type a message and click send
10. Messages appear with sender names

## Files Modified/Created

- `prisma/schema.prisma` - Added GroupChat, GroupChatMember, GroupChatMessage models
- `app/api/groupchats/route.ts` - GET/POST endpoints for groups
- `app/api/groupchats/[id]/messages/route.ts` - GET/POST endpoints for group messages
- `components/MessageSidebar.tsx` - Updated with group chat UI and NewGroupModal

## Future Enhancements

- Group member management (add/remove members)
- Group settings (rename, delete, leave group)
- Unread message counts for groups
- Typing indicators
- Message reactions
- File attachments
- @mentions
- Group avatars/icons customization
- Push notifications for group messages
