import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
  Req,
  ParseUUIDPipe,
  ForbiddenException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatsService } from './chats.service';
import {
  CreateChatDto,
  LastSeenDto,
  MessageQueryDto,
  ReadMessageDto,
  SendMessageDto,
} from './chat.dto';

@ApiTags('Chats')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ChatsController {
  constructor(private readonly chats: ChatsService) {}

  @Post('chat/create') create(
    @Body() dto: CreateChatDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.chats.createOrGet(dto.userAId, dto.userBId, req.user.sub);
  }

  @Post('chat/:chatId/message/send') send(
    @Param('chatId', ParseUUIDPipe) chatId: string,
    @Body() dto: SendMessageDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.chats.sendMessage(chatId, req.user.sub, dto.text);
  }

  @Get('chat/:chatId/messages') messages(
    @Param('chatId', ParseUUIDPipe) chatId: string,
    @Query() query: MessageQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.chats.getMessages(
      chatId,
      req.user.sub,
      query.limit,
      query.cursor,
    );
  }

  @Post('chat/:chatId/message/:messageId/read') read(
    @Param('chatId', ParseUUIDPipe) chatId: string,
    @Param('messageId') messageId: string,
    @Body() dto: ReadMessageDto,
    @Req() req: AuthenticatedRequest,
  ) {
    if (dto.userId !== req.user.sub)
      throw new ForbiddenException('Authenticated user must match userId');
    return this.chats.markRead(chatId, messageId, req.user.sub);
  }

  @Post('chat/:chatId/lastseen') lastSeen(
    @Param('chatId', ParseUUIDPipe) chatId: string,
    @Body() dto: LastSeenDto,
    @Req() req: AuthenticatedRequest,
  ) {
    if (dto.userId !== req.user.sub)
      throw new ForbiddenException('Authenticated user must match userId');
    return this.chats.updateLastSeen(chatId, req.user.sub, dto.messageId);
  }

  @Get('user/:userId/chats') list(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    if (userId !== req.user.sub)
      throw new ForbiddenException('Authenticated user must match userId');
    return this.chats.listUserChats(req.user.sub);
  }
}
