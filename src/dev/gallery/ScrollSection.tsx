// DEVELOPMENT ONLY: plan Task 9 part 5B (scrolling and interactive content controls), one block per component with the
// real Topbath call-site options, for the device check and the parity capture.
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { IonContent } from '../../components/ionic/IonContent';
import { IonFab, IonFabButton } from '../../components/ionic/IonFab';
import { IonInfiniteScroll, IonInfiniteScrollContent } from '../../components/ionic/IonInfiniteScroll';
import { IonRefresher, IonRefresherContent } from '../../components/ionic/IonRefresher';
import { IonSearchbar } from '../../components/ionic/IonSearchbar';
import { IonSegment, IonSegmentButton } from '../../components/ionic/IonSegment';
import { IonSlide, IonSlides } from '../../components/ionic/IonSlides';
import { ImageViewer } from '../../components/ImageViewer';
import { WebEmbed } from '../../components/WebEmbed';
import { colors } from '../../theme';
import { fontFor } from '../../theme/typography';

const SLIDE_COLORS = ['#e57373', '#64b5f6', '#81c784'];
const IMG = 'https://picsum.photos/id/1015/600/400'; // dev gallery only (any reachable image)
const VIDEO = 'https://www.youtube.com/embed/dQw4w9WgXcQ'; // dev gallery only

export function ScrollSection() {
  const [seg, setSeg] = useState('Pending');
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [rows, setRows] = useState(20);
  const [viewer, setViewer] = useState(false);
  return (
    <View testID="gallery-scroll">
      <Text style={styles.h}>Segment (.ion-tab-btn): {seg}</Text>
      <IonSegment inTabBtn value={seg} onValueChange={setSeg}>
        <IonSegmentButton value="Pending">Pending</IonSegmentButton>
        <IonSegmentButton value="Closed">Closed</IonSegmentButton>
        <IonSegmentButton value="Cancel">Cancel</IonSegmentButton>
      </IonSegment>

      <Text style={styles.label}>md default segment (sales-exec-plumber-list, toolbar color=light)</Text>
      <IonSegment value={seg} onValueChange={setSeg}>
        <IonSegmentButton value="Pending">Pending</IonSegmentButton>
        <IonSegmentButton value="Closed">Closed</IonSegmentButton>
        <IonSegmentButton value="Cancel">Cancel</IonSegmentButton>
      </IonSegment>

      <Text style={styles.h}>Searchbar: text {q} / ionInput (250 ms) {debounced}</Text>
      <Text style={styles.label}>.search.add-search in a primary toolbar (17 usages)</Text>
      <View style={styles.toolbar}>
        <IonSearchbar value={q} onChangeText={setQ} onIonInput={setDebounced} />
      </View>
      <Text style={styles.label}>bare ion-searchbar (main-distributor-list)</Text>
      <View style={styles.toolbar}>
        <IonSearchbar context="bare" />
      </View>
      <Text style={styles.label}>.search (gift-list)</Text>
      <View style={[styles.toolbar, { paddingTop: 30 }]}>
        <IonSearchbar context="search" />
      </View>

      <Text style={styles.h}>Slides: pager autoplay=3000 (stops after the wrap to slide 0), then pager=false</Text>
      <IonSlides pager autoplay={3000}>
        {SLIDE_COLORS.map(c => (
          <IonSlide key={c}>
            <View style={{ height: 120, backgroundColor: c }} />
          </IonSlide>
        ))}
      </IonSlides>
      <IonSlides>
        {SLIDE_COLORS.map(c => (
          <IonSlide key={c}>
            <View style={{ height: 60, backgroundColor: c }} />
          </IonSlide>
        ))}
      </IonSlides>

      <Text style={styles.h}>Refresher + infinite scroll (embedded copy; the full-screen one is easier to swipe: topbathrn://open?screen=_ScrollDemo)</Text>
      <View style={styles.list}>
        <IonContent
          testID="gallery-content"
          fixedContent={
            <IonFab horizontal="right" vertical="bottom">
              <IonFabButton color="primary" icon="add" />
            </IonFab>
          }
        >
          <IonRefresher
            onRefresh={r => {
              setTimeout(() => {
                setRows(20);
                r.complete();
              }, 1500);
            }}
          >
            <IonRefresherContent
              pullingIcon="arrow-dropdown"
              pullingText="Pull to refresh"
              refreshingSpinner="circles"
              refreshingText="Refreshing..."
            />
          </IonRefresher>
          {Array.from({ length: rows }, (_, i) => (
            <Text key={i} style={[fontFor(400), styles.row]}>
              Row {i + 1}
            </Text>
          ))}
          {rows < 60 ? (
            <IonInfiniteScroll
              threshold="100px"
              onInfinite={inf => {
                setTimeout(() => {
                  setRows(n => n + 10);
                  inf.complete();
                }, 1500);
              }}
            >
              <IonInfiniteScrollContent loadingSpinner="bubbles" loadingText="Loading more data..." />
            </IonInfiniteScroll>
          ) : null}
        </IonContent>
      </View>
      <View style={[styles.list, { height: 90 }]}>
        <IonFab horizontal="right" vertical="bottom">
          <IonFabButton color="danger" icon="add" />
        </IonFab>
        <IonFab horizontal="left" vertical="top">
          <IonFabButton color="primary" mini icon="add" />
        </IonFab>
      </View>

      <Text style={styles.h}>WebEmbed (iframe, 2px inset) and ImageViewer</Text>
      <WebEmbed uri={VIDEO} height={180} />
      <Text style={styles.btn} onPress={() => setViewer(true)} testID="gallery-open-viewer">
        Open ImageViewer
      </Text>
      <ImageViewer uri={IMG} visible={viewer} onClose={() => setViewer(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  h: { ...fontFor(500), fontSize: 15, marginTop: 20, marginBottom: 6, color: colors.text },
  label: { ...fontFor(400), fontSize: 12, color: colors.textMuted, marginTop: 6 },
  toolbar: { backgroundColor: colors.primary, paddingVertical: 4 },
  list: { height: 260, borderWidth: 1, borderColor: '#ccc' },
  row: { fontSize: 14, padding: 14, borderBottomWidth: 1, borderBottomColor: '#eee', color: '#000' },
  btn: { ...fontFor(500), marginTop: 10, padding: 12, backgroundColor: colors.primary, color: '#fff', textAlign: 'center' },
});
