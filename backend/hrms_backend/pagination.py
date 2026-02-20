from rest_framework.response import Response


class PageNumberPagination:
    """Simple page-number paginator for APIView responses."""

    page_size = 10

    def paginate_queryset(self, queryset, request):
        try:
            self.page = max(1, int(request.query_params.get('page', 1)))
            self.page_size_param = min(
                100,
                max(1, int(request.query_params.get('page_size', self.page_size)))
            )
        except (ValueError, TypeError):
            self.page = 1
            self.page_size_param = self.page_size

        self.total = queryset.count()
        self.total_pages = max(1, (self.total + self.page_size_param - 1) // self.page_size_param)
        self.page = min(self.page, self.total_pages)

        start = (self.page - 1) * self.page_size_param
        end = start + self.page_size_param
        return queryset[start:end]

    def get_paginated_response(self, data, success=True, extra=None):
        payload = {
            'success': success,
            'total': self.total,
            'total_pages': self.total_pages,
            'current_page': self.page,
            'page_size': self.page_size_param,
            'has_next': self.page < self.total_pages,
            'has_previous': self.page > 1,
            'data': data,
        }
        if extra:
            payload.update(extra)
        return Response(payload)
