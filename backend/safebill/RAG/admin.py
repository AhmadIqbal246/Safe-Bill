"""
RAG Admin Configuration
"""

from django.contrib import admin
from django.utils.html import format_html
from RAG.models import ChatbotHistoryConversation, ConversationSession


@admin.register(ChatbotHistoryConversation)
class ChatbotHistoryConversationAdmin(admin.ModelAdmin):
    """Admin interface for conversation history"""
    
    list_display = [
        'id',
        'user',
        'conversation_id_short',
        'query_preview',
        'score_display',
        'created_at_short',
        'performance_badge'
    ]
    list_filter = [
        'created_at',
        'user',
        'avg_chunk_score',
    ]
    search_fields = [
        'user_query',
        'response_text',
        'user__username',
        'conversation_id'
    ]
    readonly_fields = [
        'conversation_id',
        'created_at',
        'updated_at',
        'query_embedding_preview',
        'chunks_preview',
        'performance_summary',
        'chunks_summary_display'
    ]
    
    fieldsets = (
        ('Conversation Info', {
            'fields': ('conversation_id', 'user', 'created_at', 'updated_at')
        }),
        ('Content', {
            'fields': ('user_query', 'response_text', 'context_summary')
        }),
        ('Embeddings & Retrieval', {
            'fields': ('query_embedding_preview', 'chunks_preview', 'chunks_summary_display'),
            'classes': ('collapse',)
        }),
        ('Quality Metrics', {
            'fields': ('avg_chunk_score', 'max_chunk_score', 'performance_summary'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('metadata',),
            'classes': ('collapse',)
        }),
    )
    
    def conversation_id_short(self, obj):
        """Display shortened conversation ID"""
        return str(obj.conversation_id)[:8]
    conversation_id_short.short_description = 'Conversation'
    
    def query_preview(self, obj):
        """Display query preview"""
        preview = obj.user_query[:50]
        if len(obj.user_query) > 50:
            preview += '...'
        return preview
    query_preview.short_description = 'Query'
    
    def score_display(self, obj):
        """Display score with color coding"""
        score = obj.avg_chunk_score
        if score >= 0.7:
            color = 'green'
            status = '✓ High'
        elif score >= 0.5:
            color = 'orange'
            status = '~ Medium'
        else:
            color = 'red'
            status = '✗ Low'
        
        return format_html(
            '<span style="color: {}; font-weight: bold;">{} ({:.4f})</span>',
            color,
            status,
            score
        )
    score_display.short_description = 'Score'
    
    def created_at_short(self, obj):
        """Display creation time"""
        return obj.created_at.strftime('%Y-%m-%d %H:%M')
    created_at_short.short_description = 'Created'
    
    def performance_badge(self, obj):
        """Display performance badge"""
        total_time = obj.response_time_ms + obj.embedding_time_ms + obj.search_time_ms
        if total_time < 1000:
            color = 'green'
            status = '⚡ Fast'
        elif total_time < 3000:
            color = 'orange'
            status = '⏱ Medium'
        else:
            color = 'red'
            status = '🐢 Slow'
        
        return format_html(
            '<span style="color: {}; font-weight: bold;">{} ({}ms)</span>',
            color,
            status,
            total_time
        )
    performance_badge.short_description = 'Performance'
    
    def query_embedding_preview(self, obj):
        """Display embedding preview"""
        if not obj.query_embedding:
            return "No embedding"
        
        embedding = obj.query_embedding
        if isinstance(embedding, list) and len(embedding) > 0:
            return f"Vector ({len(embedding)} dimensions) - Sample: [{embedding[0]:.4f}, {embedding[1]:.4f}, ...]"
        return str(embedding)[:100]
    query_embedding_preview.short_description = 'Query Embedding'
    
    def chunks_preview(self, obj):
        """Display chunks preview"""
        if not obj.retrieved_chunks:
            return "No chunks retrieved"
        
        chunks = obj.retrieved_chunks
        preview = f"Retrieved {len(chunks)} chunks:\n"
        for i, chunk in enumerate(chunks[:3], 1):
            doc = chunk.get('metadata', {}).get('document_title', 'Unknown')
            score = chunk.get('score', 0)
            preview += f"{i}. {doc} (score: {score:.4f})\n"
        
        return preview
    chunks_preview.short_description = 'Retrieved Chunks'
    
    def chunks_summary_display(self, obj):
        """Display chunks summary"""
        summary = obj.get_chunks_summary()
        if not summary:
            return "No chunks"
        
        html = "<table style='border-collapse: collapse; width: 100%;'>"
        html += "<tr style='background-color: #f0f0f0;'><th style='border: 1px solid #ddd; padding: 8px;'>Document</th><th style='border: 1px solid #ddd; padding: 8px;'>Section</th><th style='border: 1px solid #ddd; padding: 8px;'>Score</th></tr>"
        
        for chunk in summary:
            html += f"<tr><td style='border: 1px solid #ddd; padding: 8px;'>{chunk['document']}</td>"
            html += f"<td style='border: 1px solid #ddd; padding: 8px;'>{chunk['section']}</td>"
            html += f"<td style='border: 1px solid #ddd; padding: 8px;'>{chunk['score']:.4f}</td></tr>"
        
        html += "</table>"
        return format_html(html)
    chunks_summary_display.short_description = 'Chunks Summary'
    
    def performance_summary(self, obj):
        """Display performance summary"""
        perf = obj.get_performance_summary()
        html = "<table style='border-collapse: collapse;'>"
        for key, value in perf.items():
            html += f"<tr><td style='padding: 5px;'><strong>{key}:</strong></td><td style='padding: 5px;'>{value}</td></tr>"
        html += "</table>"
        return format_html(html)
    performance_summary.short_description = 'Performance Metrics'
    
    def has_add_permission(self, request):
        """Disable manual addition"""
        return False
    
    def has_delete_permission(self, request, obj=None):
        """Allow deletion only for superusers"""
        return request.user.is_superuser


@admin.register(ConversationSession)
class ConversationSessionAdmin(admin.ModelAdmin):
    """Admin interface for conversation sessions"""
    
    list_display = [
        'id',
        'user',
        'title_short',
        'message_count',
        'status_badge',
        'updated_at_short'
    ]
    list_filter = [
        'created_at',
        'updated_at',
        'user',
        'is_active'
    ]
    search_fields = [
        'title',
        'description',
        'user__username',
        'conversation_id'
    ]
    readonly_fields = [
        'conversation_id',
        'created_at',
        'updated_at',
        'ended_at'
    ]
    
    fieldsets = (
        ('Session Info', {
            'fields': ('conversation_id', 'user', 'created_at', 'updated_at', 'ended_at')
        }),
        ('Details', {
            'fields': ('title', 'description', 'message_count', 'is_active')
        }),
    )
    
    def title_short(self, obj):
        """Display shortened title"""
        return obj.title[:50] if obj.title else 'Untitled'
    title_short.short_description = 'Title'
    
    def status_badge(self, obj):
        """Display status badge"""
        if obj.is_active:
            return format_html(
                '<span style="color: green; font-weight: bold;">● Active</span>'
            )
        else:
            return format_html(
                '<span style="color: red; font-weight: bold;">● Closed</span>'
            )
    status_badge.short_description = 'Status'
    
    def updated_at_short(self, obj):
        """Display update time"""
        return obj.updated_at.strftime('%Y-%m-%d %H:%M')
    updated_at_short.short_description = 'Updated'
    
    def has_add_permission(self, request):
        """Disable manual addition"""
        return False
