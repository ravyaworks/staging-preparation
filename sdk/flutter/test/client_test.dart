import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:test/test.dart';
import 'package:conversation_platform_sdk/conversation_platform_sdk.dart';
import 'package:http/testing.dart';

void main() {
  late ConversationClient client;
  late MockClient mockHttp;

  setUp(() {
    mockHttp = MockClient((request) async {
      final path = request.url.path;
      final method = request.method;

      if (path == '/conversations' && method == 'GET') {
        return http.Response(jsonEncode({
          'success': true,
          'data': {
            'items': [
              {
                'id': 'conv-1',
                'tenantId': 'tenant-1',
                'channelId': 'web',
                'status': 'active',
                'metadata': {},
                'createdAt': '2024-01-01T00:00:00Z',
                'updatedAt': '2024-01-01T00:00:00Z',
              },
            ],
            'total': 1,
            'page': 1,
            'limit': 20,
            'hasMore': false,
          },
        }), 200);
      }

      if (path == '/conversations/conv-1' && method == 'GET') {
        return http.Response(jsonEncode({
          'success': true,
          'data': {
            'id': 'conv-1',
            'tenantId': 'tenant-1',
            'channelId': 'web',
            'status': 'active',
            'metadata': {},
            'createdAt': '2024-01-01T00:00:00Z',
            'updatedAt': '2024-01-01T00:00:00Z',
          },
        }), 200);
      }

      if (path == '/conversations' && method == 'POST') {
        return http.Response(jsonEncode({
          'success': true,
          'data': {
            'id': 'conv-2',
            'tenantId': 'tenant-1',
            'channelId': 'web',
            'status': 'active',
            'metadata': {},
            'createdAt': '2024-01-01T00:00:00Z',
            'updatedAt': '2024-01-01T00:00:00Z',
          },
        }), 201);
      }

      if (path == '/channels' && method == 'GET') {
        return http.Response(jsonEncode({
          'success': true,
          'data': [
            {
              'id': 'ch-1',
              'type': 'whatsapp',
              'name': 'WhatsApp Business',
              'config': {},
              'enabled': true,
              'connected': true,
              'createdAt': '2024-01-01T00:00:00Z',
              'updatedAt': '2024-01-01T00:00:00Z',
            },
          ],
        }), 200);
      }

      if (path == '/webhooks' && method == 'GET') {
        return http.Response(jsonEncode({
          'success': true,
          'data': [
            {
              'id': 'wh-1',
              'url': 'https://example.com/webhook',
              'events': ['message.received'],
              'secret': 'sec-123',
              'enabled': true,
              'createdAt': '2024-01-01T00:00:00Z',
              'updatedAt': '2024-01-01T00:00:00Z',
            },
          ],
        }), 200);
      }

      if (path.startsWith('/knowledge/search') && method == 'POST') {
        return http.Response(jsonEncode({
          'success': true,
          'data': {
            'query': 'test',
            'results': [
              {
                'documentId': 'doc-1',
                'libraryId': 'lib-1',
                'title': 'Test Doc',
                'snippet': 'This is a test',
                'score': 0.95,
                'metadata': {},
              },
            ],
          },
        }), 200);
      }

      return http.Response(jsonEncode({
        'success': false,
        'error': {'message': 'Not found', 'code': 'NOT_FOUND'},
      }), 404);
    });

    client = ConversationClient(
      baseUrl: 'https://api.example.com',
      apiKey: 'test-key',
      httpClient: mockHttp,
    );
  });

  tearDown(() {
    client.dispose();
  });

  group('ConversationClient', () {
    test('listConversations returns conversations', () async {
      final conversations = await client.listConversations();
      expect(conversations.length, 1);
      expect(conversations.first.id, 'conv-1');
      expect(conversations.first.status, 'active');
    });

    test('getConversation returns single conversation', () async {
      final conversation = await client.getConversation('conv-1');
      expect(conversation.id, 'conv-1');
      expect(conversation.channelId, 'web');
    });

    test('createConversation returns created conversation', () async {
      final conversation = await client.createConversation(channelId: 'web');
      expect(conversation.id, 'conv-2');
    });

    test('listChannels returns channels', () async {
      final channels = await client.listChannels();
      expect(channels.length, 1);
      expect(channels.first.type, 'whatsapp');
    });

    test('listWebhooks returns webhooks', () async {
      final webhooks = await client.listWebhooks();
      expect(webhooks.length, 1);
      expect(webhooks.first.url, 'https://example.com/webhook');
    });

    test('searchKnowledge returns results', () async {
      final result = await client.searchKnowledge('test');
      expect(result.query, 'test');
      expect(result.results.length, 1);
      expect(result.results.first.score, 0.95);
    });

    test('dispose closes HTTP client', () {
      client.dispose();
    });

    test('throws exception on error response', () async {
      try {
        await client.getConversation('nonexistent');
        fail('Expected exception');
      } on ConversationPlatformException catch (e) {
        expect(e.code, 'NOT_FOUND');
        expect(e.statusCode, 404);
      }
    });
  });
}
