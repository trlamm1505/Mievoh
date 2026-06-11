import React, { useEffect, useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet, 
  ActivityIndicator, 
  Dimensions, 
  TextInput, 
  Modal,
  Linking,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppNavigation } from '../../../navigation/navigation';
import { getMovieDetailApi, getShowtimesByMovieApi, getReviewsByMovieApi, createReviewApi, Movie } from '../../../axios/movie';
import { useAuth } from '../../../contextAPI/Auth/AuthContext';
import { toast } from '../../../components/Toast/Toast';
import Button from '../../../components/Button/Button';
import { WebView } from 'react-native-webview';
import YoutubePlayer from 'react-native-youtube-iframe';
import { useTheme } from '../../../contextAPI/Theme/ThemeContext';
import { useLanguage } from '../../../contextAPI/Language/LanguageContext';

function getYoutubeVideoId(url: string): string | null {
  if (!url) return null;
  const cleanUrl = url.trim();
  
  // If it's already a clean 11-char YouTube ID
  if (cleanUrl.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(cleanUrl)) {
    return cleanUrl;
  }
  
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = cleanUrl.match(regExp);
  return (match && match[2] && match[2].length === 11) ? match[2] : null;
}


const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;

export interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
  date: string;
}

export default function MovieDetail() {
  const { id } = useLocalSearchParams();
  const navigation = useAppNavigation();
  const { isLoggedIn, user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { language, t } = useLanguage();

  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [showtimesData, setShowtimesData] = useState<any>(null);
  const [loadingShowtimes, setLoadingShowtimes] = useState(false);
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [isDescCollapsed, setIsDescCollapsed] = useState(true);

  // Bottom Sheet/Modal state for Showtimes
  const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false);

  // Reviews & Rating states
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userRating, setUserRating] = useState(5);
  const [commentText, setCommentText] = useState('');
  const [guestName, setGuestName] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Trailer Modal state
  const [isTrailerVisible, setIsTrailerVisible] = useState(false);

  // Generate date list for the next 7 days
  const dateOptions = useMemo(() => {
    const list = [];
    const weekdays = language === 'vi' 
      ? ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'] 
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      
      const dayNum = d.getDate();
      const dayStr = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
      const monthNum = d.getMonth() + 1;
      const monthStr = monthNum < 10 ? `0${monthNum}` : `${monthNum}`;
      const year = d.getFullYear();
      
      const queryDate = `${dayStr}/${monthStr}/${year}`;
      
      let label = weekdays[d.getDay()];
      if (i === 0) label = language === 'vi' ? 'Hôm nay' : 'Today';
      
      list.push({
        label,
        dateNum: dayStr,
        queryDate,
      });
    }
    return list;
  }, [language]);

  // Fetch Movie details
  useEffect(() => {
    if (!id) return;
    
    const fetchMovieDetail = async () => {
      setLoading(true);
      try {
        const res = await getMovieDetailApi(id as string);
        setMovie(res);

        // Load reviews: fetch from backend dedicated endpoint
        let defaultReviewsList: Review[] = [];
        try {
          const reviewsRes = await getReviewsByMovieApi(id as string);
          const rawReviews = reviewsRes as any;
          const reviewItems = 
            rawReviews.data?.reviews || 
            rawReviews.data?.data || 
            rawReviews.reviews || 
            (Array.isArray(rawReviews.data) ? rawReviews.data : null) ||
            (Array.isArray(rawReviews) ? rawReviews : []);
          defaultReviewsList = reviewItems.map((r: any) => ({
            id: r.reviewId || String(Math.random()),
            name: r.User?.fullName || r.email || (language === 'vi' ? 'Khán giả' : 'Audience'),
            rating: r.rating || 5,
            comment: r.comment || '',
            date: r.createdAt ? new Date(r.createdAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US') : '06/06/2026'
          }));
        } catch (apiErr: any) {
          console.log('Error loading reviews from API:', apiErr.message || apiErr);
          if (apiErr.response) {
            console.log('Error response status:', apiErr.response.status);
            console.log('Error response data:', JSON.stringify(apiErr.response.data));
          }
          const rawReviews = (res as any)?.Reviews || [];
          if (rawReviews.length > 0) {
            defaultReviewsList = rawReviews.map((r: any) => ({
              id: r.reviewId || String(Math.random()),
              name: r.author || (language === 'vi' ? 'Khán giả' : 'Audience'),
              rating: r.rating || 5,
              comment: r.content || '',
              date: r.createdAt ? new Date(r.createdAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US') : '06/06/2026'
            }));
          } else {
            // No fallback reviews to keep rating synchronized with database averageRating
            defaultReviewsList = [];
          }
        }

        // Load custom reviews from AsyncStorage
        const savedCustom = await AsyncStorage.getItem(`mievoh_custom_reviews_${id}`);
        if (savedCustom) {
          const customArray = JSON.parse(savedCustom);
          // Combine and filter duplicates
          const combined = [...customArray, ...defaultReviewsList];
          const unique = combined.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
          setReviews(unique);
        } else {
          setReviews(defaultReviewsList);
        }
      } catch (err) {
        console.error('Lỗi khi lấy chi tiết phim:', err);
        toast.error(language === 'vi' ? 'Không thể tải thông tin chi tiết phim.' : 'Failed to load movie details.');
      } finally {
        setLoading(false);
      }
    };

    fetchMovieDetail();
  }, [id, language]);

  // Fetch Showtimes based on movie ID and selected date index (when bottom sheet is open)
  useEffect(() => {
    if (!id || !isBottomSheetVisible) return;
    
    const fetchShowtimes = async () => {
      setShowtimesData(null);
      setLoadingShowtimes(true);
      try {
        const dateStr = dateOptions[selectedDateIndex].queryDate;
        const res = await getShowtimesByMovieApi(id as string, dateStr);
        setShowtimesData(res);
      } catch (err) {
        console.error('Lỗi khi lấy lịch chiếu:', err);
        setShowtimesData(null);
      } finally {
        setLoadingShowtimes(false);
      }
    };

    fetchShowtimes();
  }, [id, selectedDateIndex, dateOptions, isBottomSheetVisible]);

  // Calculate review stats
  const averageRating = useMemo(() => {
    if (reviews.length === 0) return movie?.averageRating || 5.0;
    const total = reviews.reduce((sum, r) => sum + r.rating, 0);
    return total / reviews.length;
  }, [reviews, movie]);

  const ratingDistribution = useMemo(() => {
    const dist = [0, 0, 0, 0, 0]; // 5, 4, 3, 2, 1 stars
    reviews.forEach(r => {
      const idx = 5 - Math.round(r.rating);
      if (idx >= 0 && idx < 5) {
        dist[idx]++;
      }
    });
    return dist;
  }, [reviews]);

  // Handle Review Submission
  const handleAddReview = async () => {
    if (!isLoggedIn) {
      toast.error(language === 'vi' ? 'Vui lòng đăng nhập để đánh giá phim!' : 'Please log in to review this movie!');
      return;
    }

    if (!commentText.trim()) {
      toast.error(language === 'vi' ? 'Vui lòng nhập nội dung đánh giá!' : 'Please enter review comments!');
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await createReviewApi({
        movieId: id as string,
        rating: userRating,
        comment: commentText.trim()
      });

      // Fetch reviews again to get the latest list with updated stats from database
      let updatedReviewsList: Review[] = [];
      try {
        const reviewsRes = await getReviewsByMovieApi(id as string);
        const rawReviews = reviewsRes as any;
        const reviewItems = 
          rawReviews.data?.reviews || 
          rawReviews.data?.data || 
          rawReviews.reviews || 
          (Array.isArray(rawReviews.data) ? rawReviews.data : null) ||
          (Array.isArray(rawReviews) ? rawReviews : []);
        updatedReviewsList = reviewItems.map((r: any) => ({
          id: r.reviewId || String(Math.random()),
          name: r.User?.fullName || r.email || (language === 'vi' ? 'Khán giả' : 'Audience'),
          rating: r.rating || 5,
          comment: r.comment || '',
          date: r.createdAt ? new Date(r.createdAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US') : '06/06/2026'
        }));
      } catch (apiErr) {
        console.log('Error re-fetching reviews:', apiErr);
        const today = new Date();
        const formattedDate = today.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US');
        const localReview: Review = {
          id: res.data?.reviewId || String(Date.now()),
          name: user?.fullName || user?.email || (language === 'vi' ? 'Thành viên' : 'Member'),
          rating: userRating,
          comment: commentText.trim(),
          date: formattedDate
        };
        updatedReviewsList = [localReview, ...reviews];
      }

      setReviews(updatedReviewsList);
      setCommentText('');
      setUserRating(5);
      toast.success(language === 'vi' ? 'Đăng đánh giá thành công!' : 'Review posted successfully!');
    } catch (e: any) {
      console.error(e);
      const errMsg = e?.response?.data?.message || (language === 'vi' ? 'Có lỗi xảy ra, vui lòng thử lại.' : 'An error occurred, please try again.');
      toast.error(errMsg);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, isDark && styles.loadingContainerDark]}>
        <ActivityIndicator size="large" color="#7B61FF" />
        <Text style={[styles.loadingText, isDark && styles.loadingTextDark]}>
          {language === 'vi' ? 'Đang tải thông tin phim...' : 'Loading movie details...'}
        </Text>
      </View>
    );
  }

  if (!movie) {
    return (
      <View style={[styles.errorContainer, isDark && styles.errorContainerDark]}>
        <Ionicons name="film-outline" size={54} color="#EF4444" />
        <Text style={[styles.errorText, isDark && styles.errorTextDark]}>
          {language === 'vi' ? 'Không tìm thấy thông tin phim.' : 'Movie not found.'}
        </Text>
        <TouchableOpacity style={styles.backButtonOutline} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>{language === 'vi' ? 'Quay lại' : 'Go Back'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const backdropImage = movie.imageUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80';
  const movieTitleText = language === 'vi' 
    ? (movie.title_vi || movie.title_en)
    : (movie.title_en || movie.title_vi);
  const movieDescText = language === 'vi' 
    ? (movie.description_vi || movie.description_en || 'Chưa có thông tin mô tả chi tiết cho phim này.')
    : (movie.description_en || movie.description_vi || 'No description available for this movie.');

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      {/* Absolute Floating Back Button */}
      <TouchableOpacity 
        style={[styles.floatingBackButton, isDark && styles.floatingBackButtonDark]} 
        onPress={() => navigation.goBack()}
        activeOpacity={0.8}
      >
        <Ionicons name="chevron-back" size={24} color="#7B61FF" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Backdrop Header */}
        <View style={styles.backdropContainer}>
          <Image source={{ uri: backdropImage }} style={styles.backdropImage} resizeMode="cover" />
          <LinearGradient
            colors={['transparent', isDark ? 'rgba(15, 12, 32, 0.4)' : 'rgba(250, 248, 255, 0.4)', isDark ? '#0F0C20' : '#FAF8FF']}
            style={styles.backdropGradient}
          />
        </View>

        {/* Content Section */}
        <View style={styles.contentContainer}>
          {/* Poster and Basic Meta Info */}
          <View style={styles.headerMetaRow}>
            <View style={styles.posterContainer}>
              <Image source={{ uri: backdropImage }} style={styles.posterImage} resizeMode="cover" />
            </View>

            <View style={styles.metaTextCol}>
              <Text style={[styles.movieTitle, isDark && styles.movieTitleDark]} numberOfLines={2}>
                {movieTitleText}
              </Text>
              
              {movie.title_en && movie.title_vi && (
                <Text style={[styles.movieSubTitle, isDark && styles.movieSubTitleDark]} numberOfLines={1}>
                  {language === 'vi' ? movie.title_en : movie.title_vi}
                </Text>
              )}

              <View style={styles.infoBadgeRow}>
                <Text style={styles.ratingText}>★ {averageRating.toFixed(1)}</Text>
                <Text style={styles.dividerDot}>|</Text>
                <Text style={[styles.durationText, isDark && styles.durationTextDark]}>
                  {movie.duration || 120} {language === 'vi' ? 'phút' : 'mins'}
                </Text>
                {movie.ageRestriction && (
                  <>
                    <Text style={styles.dividerDot}>|</Text>
                    <View style={styles.ageBadge}>
                      <Text style={styles.ageBadgeText}>{movie.ageRestriction}</Text>
                    </View>
                  </>
                )}
              </View>

              {movie.genres && movie.genres.length > 0 && (
                <Text style={styles.genresText} numberOfLines={1}>
                  {movie.genres.join(', ')}
                </Text>
              )}
            </View>
          </View>

          {/* Description Synopsis */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
              {language === 'vi' ? 'Nội dung phim' : 'Synopsis'}
            </Text>
            <Text style={[styles.descriptionText, isDark && styles.descriptionTextDark]} numberOfLines={isDescCollapsed ? 3 : undefined}>
              {movieDescText}
            </Text>
            <TouchableOpacity onPress={() => setIsDescCollapsed(!isDescCollapsed)} style={styles.readMoreBtn}>
              <Text style={styles.readMoreText}>
                {isDescCollapsed 
                  ? (language === 'vi' ? 'Xem thêm' : 'Read more') 
                  : (language === 'vi' ? 'Thu gọn' : 'Show less')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Director & Cast */}
          <View style={[styles.detailsRowContainer, isDark && styles.detailsRowContainerDark]}>
            {movie.director && (
              <View style={styles.detailsCol}>
                <Text style={styles.detailsHeader}>{language === 'vi' ? 'Đạo diễn' : 'Director'}</Text>
                <Text style={[styles.detailsValue, isDark && styles.detailsValueDark]}>{movie.director}</Text>
              </View>
            )}
            {movie.cast && (
              <View style={[styles.detailsCol, { flex: 2 }]}>
                <Text style={styles.detailsHeader}>{language === 'vi' ? 'Diễn viên' : 'Cast'}</Text>
                <Text style={[styles.detailsValue, isDark && styles.detailsValueDark]} numberOfLines={2}>{movie.cast}</Text>
              </View>
            )}
          </View>

          {/* Rating Summary & Breakdown */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
              {language === 'vi' ? 'Đánh giá từ khán giả' : 'Audience Reviews'}
            </Text>
            
            <View style={[styles.statsCard, isDark && styles.statsCardDark]}>
              <View style={[styles.averageStatsCol, isDark && styles.averageStatsColDark]}>
                <Text style={styles.averageScoreText}>{averageRating.toFixed(1)}</Text>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Ionicons 
                      key={s} 
                      name={s <= Math.round(averageRating) ? "star" : "star-outline"} 
                      size={14} 
                      color="#F59E0B" 
                      style={{ marginRight: 2 }}
                    />
                  ))}
                </View>
                <Text style={[styles.totalReviewsText, isDark && styles.totalReviewsTextDark]}>
                  {reviews.length} {language === 'vi' ? 'đánh giá' : 'reviews'}
                </Text>
              </View>

              <View style={styles.barsCol}>
                {[5, 4, 3, 2, 1].map((stars, idx) => {
                  const count = ratingDistribution[idx];
                  const total = reviews.length || 1;
                  const percent = (count / total) * 100;
                  return (
                    <View key={stars} style={styles.barItemRow}>
                      <Text style={[styles.barStarText, isDark && styles.barStarTextDark]}>{stars} ★</Text>
                      <View style={[styles.barTrack, isDark && styles.barTrackDark]}>
                        <View style={[styles.barFill, { width: `${percent}%` }]} />
                      </View>
                      <Text style={[styles.barCountText, isDark && styles.barCountTextDark]}>{count}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Comments List */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
              {language === 'vi' ? `Bình luận (${reviews.length})` : `Comments (${reviews.length})`}
            </Text>
            {reviews.length === 0 ? (
              <View style={[styles.emptyCommentsCard, isDark && styles.emptyCommentsCardDark]}>
                <Text style={[styles.emptyCommentsText, isDark && styles.emptyCommentsTextDark]}>
                  {language === 'vi' ? 'Chưa có bình luận nào. Hãy là người đầu tiên đánh giá!' : 'No comments yet. Be the first to review!'}
                </Text>
              </View>
            ) : (
              reviews.map((r) => (
                <View key={r.id} style={[styles.commentItemCard, isDark && styles.commentItemCardDark]}>
                  {/* User Initial Avatar */}
                  <View style={styles.commentAvatar}>
                    <Text style={styles.commentAvatarText}>{(r.name || 'U').charAt(0).toUpperCase()}</Text>
                  </View>
                  
                  <View style={styles.commentContentCol}>
                    <View style={styles.commentHeaderRow}>
                      <Text style={[styles.commentAuthor, isDark && styles.commentAuthorDark]}>{r.name}</Text>
                      <Text style={styles.commentDate}>{r.date}</Text>
                    </View>
                    
                    {/* Stars */}
                    <View style={[styles.starsRow, { marginBottom: 6 }]}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Ionicons 
                          key={s} 
                          name={s <= r.rating ? "star" : "star-outline"} 
                          size={10} 
                          color="#F59E0B" 
                          style={{ marginRight: 2 }}
                        />
                      ))}
                    </View>

                    <Text style={[styles.commentTextContent, isDark && styles.commentTextContentDark]}>{r.comment}</Text>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Write a Review Section */}
          <View style={[styles.sectionContainer, { marginBottom: 80 }]}>
            <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
              {language === 'vi' ? 'Viết đánh giá của bạn' : 'Write a Review'}
            </Text>
            <View style={[styles.writeReviewCard, isDark && styles.writeReviewCardDark]}>
              {/* Star selector */}
              <View style={styles.ratingInputRow}>
                <Text style={[styles.ratingInputLabel, isDark && styles.ratingInputLabelDark]}>
                  {language === 'vi' ? 'Điểm số của bạn:' : 'Your Rating:'}
                </Text>
                <View style={styles.ratingInputStars}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <TouchableOpacity key={s} onPress={() => setUserRating(s)} activeOpacity={0.7}>
                      <Ionicons 
                        name={s <= userRating ? "star" : "star-outline"} 
                        size={26} 
                        color="#F59E0B" 
                        style={{ marginRight: 4 }}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.ratingInputValue}>{userRating}/5</Text>
              </View>

              {/* Guest Name input if not logged in */}
              {!isLoggedIn && (
                <View style={styles.inputFieldContainer}>
                  <Text style={[styles.inputFieldLabel, isDark && styles.inputFieldLabelDark]}>
                    {language === 'vi' ? 'Họ và tên của bạn' : 'Your Full Name'}
                  </Text>
                  <TextInput
                    style={[styles.textInputStyle, isDark && styles.textInputStyleDark]}
                    value={guestName}
                    onChangeText={setGuestName}
                    placeholder={language === 'vi' ? 'Nhập tên của bạn để hiển thị' : 'Enter your name to display'}
                    placeholderTextColor={isDark ? '#9CA3AF' : '#9CA3AF'}
                  />
                </View>
              )}

              {/* Comment text area */}
              <View style={styles.inputFieldContainer}>
                <Text style={[styles.inputFieldLabel, isDark && styles.inputFieldLabelDark]}>
                  {language === 'vi' ? 'Bình luận của bạn' : 'Your Comment'}
                </Text>
                <TextInput
                  style={[styles.textInputStyle, isDark && styles.textInputStyleDark, { height: 80, textAlignVertical: 'top' }]}
                  value={commentText}
                  onChangeText={setCommentText}
                  placeholder={language === 'vi' ? 'Nhập cảm nhận của bạn về bộ phim này...' : 'Enter your thoughts about this movie...'}
                  placeholderTextColor={isDark ? '#9CA3AF' : '#9CA3AF'}
                  multiline
                  numberOfLines={4}
                />
              </View>

              {/* Submit button */}
              <TouchableOpacity 
                style={styles.submitReviewBtn} 
                onPress={handleAddReview}
                disabled={submittingReview}
                activeOpacity={0.8}
              >
                {submittingReview ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.submitReviewBtnText}>
                    {language === 'vi' ? 'Gửi đánh giá' : 'Submit Review'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Actions Bar */}
      <View style={[styles.stickyFooterBar, isDark && styles.stickyFooterBarDark]}>
        {/* Watch Trailer Button */}
        <Button
          variant="secondary"
          size="sm"
          onPress={() => {
            if (movie.trailerUrl) {
              setIsTrailerVisible(true);
            } else {
              toast.error(language === 'vi' ? 'Phim này chưa có trailer.' : 'No trailer available for this movie.');
            }
          }}
          className="flex-1 rounded-full"
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="play-circle-outline" size={16} color={isDark ? "#9F8CFF" : "#7B61FF"} style={{ marginRight: 6 }} />
            <Text style={{ color: isDark ? "#9F8CFF" : "#7B61FF", fontSize: 13, fontWeight: 'bold' }}>
              {language === 'vi' ? 'Xem Trailer' : 'Watch Trailer'}
            </Text>
          </View>
        </Button>

        {/* Book Ticket Button */}
        <Button
          variant="primary"
          size="sm"
          onPress={() => setIsBottomSheetVisible(true)}
          className="flex-1 rounded-full"
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="ticket-outline" size={16} color="white" style={{ marginRight: 6 }} />
            <Text style={{ color: 'white', fontSize: 13, fontWeight: 'bold' }}>
              {language === 'vi' ? 'Mua Vé' : 'Book Tickets'}
            </Text>
          </View>
        </Button>
      </View>

      {/* Trailer Video Modal */}
      <Modal
        visible={isTrailerVisible}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => setIsTrailerVisible(false)}
      >
        <View style={[
          styles.trailerModalContainer,
          { backgroundColor: '#000000' }
        ]}>
          {/* Header containing title and close button */}
          <View style={styles.trailerHeader}>
            <Text style={styles.trailerMovieTitle} numberOfLines={1}>
              {movieTitleText}
            </Text>
            <TouchableOpacity 
              style={styles.trailerCloseIcon}
              onPress={() => setIsTrailerVisible(false)}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={28} color="white" />
            </TouchableOpacity>
          </View>
          
          {movie.trailerUrl ? (
            <View style={[
              styles.webviewWrapper,
              { backgroundColor: '#000000' }
            ]}>
              {getYoutubeVideoId(movie.trailerUrl) ? (
                <YoutubePlayer
                  height={SCREEN_WIDTH * (9 / 16)}
                  play={true}
                  videoId={getYoutubeVideoId(movie.trailerUrl)!}
                  webViewProps={{
                    androidLayerType: 'hardware',
                  }}
                />
              ) : (
                <WebView
                  style={[
                    styles.trailerWebView,
                    { backgroundColor: '#000000' }
                  ]}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                  allowsFullscreenVideo={true}
                  allowsInlineMediaPlayback={true}
                  mediaPlaybackRequiresUserAction={false}
                  androidLayerType="hardware"
                  originWhitelist={['*']}
                  source={{ uri: movie.trailerUrl }}
                />
              )}
            </View>
          ) : (
            <View style={styles.noTrailerFallback}>
              <Ionicons name="alert-circle-outline" size={48} color="#9CA3AF" />
              <Text style={[
                styles.noTrailerText,
                { color: '#D1D5DB' }
              ]}>
                {language === 'vi' ? 'Trailer không khả dụng cho phim này.' : 'Trailer not available for this movie.'}
              </Text>
            </View>
          )}
        </View>
      </Modal>

      {/* Bottom Sheet Modal for Showtime Calendar */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isBottomSheetVisible}
        onRequestClose={() => setIsBottomSheetVisible(false)}
      >
        <View style={styles.modalOverlay}>
          {/* Close trigger when clicking the transparent backdrop top */}
          <TouchableOpacity 
            style={styles.modalBackdropDismiss} 
            activeOpacity={1}
            onPress={() => setIsBottomSheetVisible(false)}
          />

          <View style={[styles.modalSheetContainer, isDark && styles.modalSheetContainerDark]}>
            {/* Sheet Handle */}
            <View style={[styles.sheetHandleBar, isDark && styles.sheetHandleBarDark]} />

            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>
                {language === 'vi' ? 'Chọn lịch chiếu' : 'Select Showtime'}
              </Text>
              <TouchableOpacity onPress={() => setIsBottomSheetVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close-circle" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Horizontal Date Picker */}
            <View style={styles.modalDatePickerContainer}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={{ paddingHorizontal: 16 }}
              >
                {dateOptions.map((date, idx) => {
                  const isSelected = selectedDateIndex === idx;
                  return (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => setSelectedDateIndex(idx)}
                      style={[
                        styles.dateItem, 
                        isSelected && styles.dateItemActive,
                        isDark && !isSelected && styles.dateItemDark
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text style={[
                        styles.dateLabel, 
                        isSelected && styles.dateLabelActive,
                        isDark && !isSelected && styles.dateLabelDark
                      ]}>
                        {date.label}
                      </Text>
                      <Text style={[
                        styles.dateNum, 
                        isSelected && styles.dateNumActive,
                        isDark && !isSelected && styles.dateNumDark
                      ]}>
                        {date.dateNum}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Showtime list scrollable */}
            <ScrollView style={styles.modalShowtimesScroll} contentContainerStyle={{ paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
              {loadingShowtimes ? (
                <View style={styles.showtimesLoader}>
                  <ActivityIndicator size="small" color="#7B61FF" />
                  <Text style={styles.loaderSubtext}>
                    {language === 'vi' ? 'Đang tìm lịch chiếu...' : 'Finding showtimes...'}
                  </Text>
                </View>
              ) : !showtimesData || !showtimesData.cinemaSystems || showtimesData.cinemaSystems.length === 0 ? (
                <View style={[styles.emptyShowtimes, isDark && styles.emptyShowtimesDark]}>
                  <Ionicons name="calendar-outline" size={32} color="#9CA3AF" />
                  <Text style={styles.emptyText}>
                    {language === 'vi' ? 'Phim chưa có lịch chiếu vào ngày này.' : 'No showtimes scheduled for this date.'}
                  </Text>
                </View>
              ) : (
                showtimesData.cinemaSystems.map((system: any) => (
                  <View key={system.cinemaSystemId} style={[styles.systemCard, isDark && styles.systemCardDark]}>
                    {/* Cinema Chain Title */}
                    <View style={systemHeaderStyle(system)}>
                      {system.logo ? (
                        <Image source={{ uri: system.logo }} style={styles.systemLogo} resizeMode="contain" />
                      ) : (
                        <Ionicons name="film" size={16} color="#7B61FF" style={{ marginRight: 6 }} />
                      )}
                      <Text style={[styles.systemName, isDark && styles.systemNameDark]}>{system.name}</Text>
                    </View>

                    {/* Complex list */}
                    {system.cinemaComplexes.map((complex: any) => (
                      <View key={complex.cinemaComplexId} style={[styles.complexRow, isDark && styles.complexRowDark]}>
                        <Text style={[styles.complexName, isDark && styles.complexNameDark]}>{complex.name}</Text>
                        <Text style={[styles.complexAddress, isDark && styles.complexAddressDark]} numberOfLines={1}>{complex.address}</Text>
                        
                        {/* Time slots */}
                        <View style={styles.timeSlotsRow}>
                          {complex.showtimes.map((st: any) => (
                            <TouchableOpacity
                              key={st.showtimeId}
                              onPress={() => {
                                const formattedTime = new Date(st.showDateTime).toLocaleTimeString(language === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' });
                                toast.success(
                                  language === 'vi' 
                                    ? `Bạn đã chọn suất chiếu lúc ${formattedTime} tại ${complex.name}.`
                                    : `You selected showtime ${formattedTime} at ${complex.name}.`
                                );
                                setIsBottomSheetVisible(false);
                              }}
                              style={[styles.timeSlotBtn, isDark && styles.timeSlotBtnDark]}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.timeSlotText}>
                                {new Date(st.showDateTime).toLocaleTimeString(language === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                              </Text>
                              <Text style={styles.timeSlotFormat}>{st.format || '2D'}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    ))}
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Helper to keep styling neat and bypass complex expressions in inline styles
function systemHeaderStyle(system: any) {
  return {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 10,
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8FF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF8FF',
  },
  loadingText: {
    color: '#6B7280',
    fontSize: 13,
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF8FF',
    paddingHorizontal: 20,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 20,
  },
  backButtonOutline: {
    borderWidth: 1,
    borderColor: '#7B61FF',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  backButtonText: {
    color: '#7B61FF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  floatingBackButton: {
    position: 'absolute',
    top: 48,
    left: 16,
    zIndex: 100,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(123, 97, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backdropContainer: {
    position: 'relative',
    height: SCREEN_HEIGHT * 0.42,
    width: '100%',
  },
  backdropImage: {
    width: '100%',
    height: '100%',
    opacity: 0.85,
  },
  backdropGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 250,
  },
  contentContainer: {
    paddingHorizontal: 16,
    marginTop: -SCREEN_HEIGHT * 0.08,
    paddingBottom: 40,
  },
  headerMetaRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  posterContainer: {
    width: 110,
    height: 160,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  posterImage: {
    width: '100%',
    height: '100%',
  },
  metaTextCol: {
    flex: 1,
    marginLeft: 16,
    paddingBottom: 4,
  },
  movieTitle: {
    color: '#111827',
    fontSize: 19,
    fontWeight: '900',
    lineHeight: 25,
    marginBottom: 4,
  },
  movieSubTitle: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
  },
  infoBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  ratingText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '800',
  },
  dividerDot: {
    color: '#D1D5DB',
    marginHorizontal: 8,
    fontSize: 12,
  },
  durationText: {
    color: '#4B5563',
    fontSize: 11,
    fontWeight: '600',
  },
  ageBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  ageBadgeText: {
    color: '#EF4444',
    fontSize: 8,
    fontWeight: 'bold',
  },
  genresText: {
    color: '#7B61FF',
    fontSize: 11,
    fontWeight: '700',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  descriptionText: {
    color: '#4B5563',
    fontSize: 12,
    lineHeight: 20,
    fontWeight: '400',
  },
  readMoreBtn: {
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  readMoreText: {
    color: '#7B61FF',
    fontSize: 12,
    fontWeight: '800',
  },
  detailsRowContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    paddingVertical: 16,
    marginBottom: 24,
  },
  detailsCol: {
    flex: 1,
    paddingRight: 12,
  },
  detailsHeader: {
    color: '#9CA3AF',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  detailsValue: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '600',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EAE6F0',
    padding: 16,
    alignItems: 'center',
    shadowColor: '#7B61FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  averageStatsCol: {
    width: '35%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderColor: '#EAE6F0',
    paddingRight: 12,
  },
  averageScoreText: {
    color: '#7B61FF',
    fontSize: 36,
    fontWeight: '900',
    lineHeight: 42,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  totalReviewsText: {
    color: '#6B7280',
    fontSize: 10,
    fontWeight: 'bold',
  },
  barsCol: {
    flex: 1,
    paddingLeft: 16,
    gap: 4,
  },
  barItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barStarText: {
    color: '#4B5563',
    fontSize: 9,
    fontWeight: '700',
    width: 24,
  },
  barTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#7B61FF',
    borderRadius: 3,
  },
  barCountText: {
    color: '#6B7280',
    fontSize: 9,
    fontWeight: '700',
    width: 16,
    textAlign: 'right',
  },
  writeReviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EAE6F0',
    padding: 16,
    shadowColor: '#7B61FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  ratingInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingInputLabel: {
    color: '#4B5563',
    fontSize: 11,
    fontWeight: '700',
    marginRight: 8,
  },
  ratingInputStars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingInputValue: {
    color: '#7B61FF',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 8,
    backgroundColor: 'rgba(123, 97, 255, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  inputFieldContainer: {
    marginBottom: 14,
  },
  inputFieldLabel: {
    color: '#4B5563',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
  },
  textInputStyle: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#1F2937',
    fontSize: 12,
  },
  submitReviewBtn: {
    backgroundColor: '#7B61FF',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  submitReviewBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  emptyCommentsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EAE6F0',
    borderStyle: 'dashed',
  },
  emptyCommentsText: {
    color: '#6B7280',
    fontSize: 11,
    textAlign: 'center',
  },
  commentItemCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EAE6F0',
    padding: 14,
    marginBottom: 10,
    shadowColor: '#7B61FF',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  commentAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E9D5FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  commentAvatarText: {
    color: '#6D28D9',
    fontSize: 13,
    fontWeight: '900',
  },
  commentContentCol: {
    flex: 1,
  },
  commentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  commentAuthor: {
    color: '#1F2937',
    fontSize: 12,
    fontWeight: '800',
    flex: 1,
  },
  commentDate: {
    color: '#9CA3AF',
    fontSize: 9,
    fontWeight: '600',
  },
  commentTextContent: {
    color: '#4B5563',
    fontSize: 11,
    lineHeight: 18,
  },
  stickyFooterBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderColor: '#EAE6F0',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdropDismiss: {
    flex: 1,
  },
  modalSheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 10,
    maxHeight: SCREEN_HEIGHT * 0.75,
    width: '100%',
    borderWidth: 1,
    borderColor: '#EAE6F0',
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  sheetHandleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  modalTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '900',
  },
  modalCloseBtn: {
    padding: 2,
  },
  modalDatePickerContainer: {
    marginBottom: 14,
  },
  modalShowtimesScroll: {
    paddingHorizontal: 16,
  },
  datePickerScroll: {
    flexDirection: 'row',
    marginBottom: 18,
  },
  dateItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 54,
    height: 62,
    borderRadius: 16,
    marginRight: 10,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dateItemActive: {
    backgroundColor: '#7B61FF',
    borderColor: '#7B61FF',
  },
  dateLabel: {
    color: '#6B7280',
    fontSize: 9,
    fontWeight: '700',
  },
  dateLabelActive: {
    color: '#FFFFFF',
  },
  dateNum: {
    color: '#1F2937',
    fontSize: 15,
    fontWeight: '900',
    marginTop: 2,
  },
  dateNumActive: {
    color: '#FFFFFF',
  },
  showtimesWrapper: {
    marginTop: 6,
  },
  showtimesLoader: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderSubtext: {
    color: '#6B7280',
    fontSize: 11,
    marginTop: 8,
  },
  emptyShowtimes: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    marginTop: 10,
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
  },
  systemCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EAE6F0',
    padding: 16,
    marginBottom: 12,
  },
  systemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  systemLogo: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 8,
  },
  systemName: {
    color: '#1F2937',
    fontSize: 13,
    fontWeight: '800',
  },
  complexRow: {
    borderTopWidth: 1,
    borderColor: '#EAE6F0',
    paddingTop: 10,
    paddingBottom: 4,
    marginTop: 8,
  },
  complexName: {
    color: '#1F2937',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  complexAddress: {
    color: '#6B7280',
    fontSize: 10,
    marginBottom: 10,
  },
  timeSlotsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlotBtn: {
    backgroundColor: 'rgba(123, 97, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(123, 97, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    minWidth: 60,
  },
  timeSlotText: {
    color: '#7B61FF',
    fontSize: 12,
    fontWeight: '800',
  },
  timeSlotFormat: {
    color: '#9CA3AF',
    fontSize: 7,
    fontWeight: 'bold',
    marginTop: 1,
    textTransform: 'uppercase',
  },
  playTrailerButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -28 }, { translateY: -28 }],
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(123, 97, 255, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7B61FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  trailerModalContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trailerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 36,
    zIndex: 10,
  },
  trailerMovieTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 16,
  },
  trailerCloseIcon: {
    padding: 4,
  },
  webviewWrapper: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000000',
  },
  trailerWebView: {
    flex: 1,
    backgroundColor: '#000000',
  },
  noTrailerFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  noTrailerText: {
    color: '#D1D5DB',
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
  containerDark: {
    backgroundColor: '#0F0C20',
  },
  loadingContainerDark: {
    backgroundColor: '#0F0C20',
  },
  loadingTextDark: {
    color: '#9CA3AF',
  },
  errorContainerDark: {
    backgroundColor: '#0F0C20',
  },
  errorTextDark: {
    color: '#EF4444',
  },
  floatingBackButtonDark: {
    backgroundColor: 'rgba(29, 24, 59, 0.85)',
    borderColor: '#2E2856',
  },
  movieTitleDark: {
    color: '#F3F4F6',
  },
  movieSubTitleDark: {
    color: '#9CA3AF',
  },
  durationTextDark: {
    color: '#9CA3AF',
  },
  sectionTitleDark: {
    color: '#F3F4F6',
  },
  descriptionTextDark: {
    color: '#9CA3AF',
  },
  detailsRowContainerDark: {
    borderColor: '#2E2856',
  },
  detailsValueDark: {
    color: '#F3F4F6',
  },
  statsCardDark: {
    backgroundColor: '#1D183B',
    borderColor: '#2E2856',
  },
  averageStatsColDark: {
    borderColor: '#2E2856',
  },
  totalReviewsTextDark: {
    color: '#9CA3AF',
  },
  barStarTextDark: {
    color: '#9CA3AF',
  },
  barTrackDark: {
    backgroundColor: '#2E2856',
  },
  barCountTextDark: {
    color: '#9CA3AF',
  },
  writeReviewCardDark: {
    backgroundColor: '#1D183B',
    borderColor: '#2E2856',
  },
  ratingInputLabelDark: {
    color: '#9CA3AF',
  },
  inputFieldLabelDark: {
    color: '#9CA3AF',
  },
  textInputStyleDark: {
    backgroundColor: '#0F0C20',
    borderColor: '#2E2856',
    color: '#F3F4F6',
  },
  emptyCommentsCardDark: {
    backgroundColor: '#1D183B',
    borderColor: '#2E2856',
  },
  emptyCommentsTextDark: {
    color: '#9CA3AF',
  },
  commentItemCardDark: {
    backgroundColor: '#1D183B',
    borderColor: '#2E2856',
  },
  commentAuthorDark: {
    color: '#F3F4F6',
  },
  commentTextContentDark: {
    color: '#9CA3AF',
  },
  stickyFooterBarDark: {
    backgroundColor: 'rgba(15, 12, 32, 0.96)',
    borderColor: '#2E2856',
  },
  modalSheetContainerDark: {
    backgroundColor: '#0F0C20',
    borderColor: '#2E2856',
  },
  sheetHandleBarDark: {
    backgroundColor: '#2E2856',
  },
  modalTitleDark: {
    color: '#F3F4F6',
  },
  dateItemDark: {
    backgroundColor: '#1D183B',
    borderColor: '#2E2856',
  },
  dateLabelDark: {
    color: '#9CA3AF',
  },
  dateNumDark: {
    color: '#F3F4F6',
  },
  emptyShowtimesDark: {
    backgroundColor: '#1D183B',
    borderColor: '#2E2856',
  },
  systemCardDark: {
    backgroundColor: '#1D183B',
    borderColor: '#2E2856',
  },
  systemNameDark: {
    color: '#F3F4F6',
  },
  complexRowDark: {
    borderColor: '#2E2856',
  },
  complexNameDark: {
    color: '#F3F4F6',
  },
  complexAddressDark: {
    color: '#9CA3AF',
  },
  timeSlotBtnDark: {
    backgroundColor: 'rgba(123, 97, 255, 0.15)',
    borderColor: 'rgba(123, 97, 255, 0.3)',
  },
});
